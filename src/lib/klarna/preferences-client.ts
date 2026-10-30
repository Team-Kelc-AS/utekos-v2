"use client";

import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";
import { storedPreferenceSchema, type Preferences } from "./preferences";

type Snapshot = {
  phase: "loading" | "ready" | "error";
  connected: boolean;
  profile: Preferences | null;
};
const initial: Snapshot = { phase: "loading", connected: false, profile: null };
let snapshot = initial;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
function publish(next: Snapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}
export async function requestPreferences(
  input: { action: "state" } | ({ action: "save" } & Preferences),
) {
  const response = await fetch("/api/identity/klarna/prospect", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(`Preference request failed: ${response.status}`);
  const body: unknown = await response.json();
  return input.action === "state"
    ? z.object({ profile: storedPreferenceSchema.nullable() }).parse(body)
    : z
        .object({
          saved: z.literal(true),
          shopifySync: z.enum(["complete", "pending"]).optional(),
        })
        .parse(body);
}
export function refreshKlarnaPreferences() {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const response = await fetch("/api/identity/klarna/status", {
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error("Klarna status unavailable");
      const status = z
        .object({ connected: z.boolean() })
        .parse(await response.json());
      if (!status.connected) {
        publish({ phase: "ready", connected: false, profile: null });
        return;
      }
      publish({ ...snapshot, phase: "loading", connected: true });
      const result = await requestPreferences({ action: "state" });
      if (!("profile" in result))
        throw new Error("Preference state unavailable");
      publish({ phase: "ready", connected: true, profile: result.profile });
    } catch {
      publish({ ...snapshot, phase: "error" });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
export function publishSavedPreferences(profile: Preferences) {
  publish({ phase: "ready", connected: true, profile });
}
export function useKlarnaPreferences() {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initial,
  );
  useEffect(() => {
    if (snapshot === initial) void refreshKlarnaPreferences();
  }, []);
  return state;
}
