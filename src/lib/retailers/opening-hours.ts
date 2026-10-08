import "server-only";

import { z } from "zod";
import type { Retailer } from "@/lib/retailers";

const responseSchema = z.object({
  businessStatus: z.enum(["OPERATIONAL", "CLOSED_TEMPORARILY", "CLOSED_PERMANENTLY"]).optional(),
  currentOpeningHours: z.object({
    weekdayDescriptions: z.array(z.string().min(1).max(500)).min(1).max(7),
  }).optional(),
  attributions: z.array(z.object({
    provider: z.string().min(1),
    providerUri: z.url().refine((url) => url.startsWith("https://")),
  })).optional(),
});

export async function getRetailerOpeningHours(retailer: Retailer) {
  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) return null;

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(retailer.placeId)}?languageCode=nb&regionCode=NO`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "businessStatus,currentOpeningHours.weekdayDescriptions,attributions",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success || parsed.data.businessStatus !== "OPERATIONAL" || !parsed.data.currentOpeningHours) return null;
    return { days: parsed.data.currentOpeningHours.weekdayDescriptions, attributions: parsed.data.attributions ?? [] };
  } catch {
    // No persistent cache, provider payloads, URLs with keys, or guessed hours.
    return null;
  }
}
