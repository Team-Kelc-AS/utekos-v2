import "server-only";

import { randomBytes } from "node:crypto";
import type { ModelMessage } from "@tanstack/ai";
import type { ChatTranscriptPersistence } from "@tanstack/ai-persistence";

const sessionPattern = /^[a-f0-9]{64}$/;
const threadPattern = /^[\w:./-]{1,200}$/;

export class ChatStorageError extends Error {
  constructor(public readonly status = 503) {
    super(status === 409
      ? "Samtalen ble endret i en annen fane. Last siden på nytt."
      : "Samtalehistorikken er midlertidig utilgjengelig.");
  }
}

export function chatStorageResponse(error: unknown) {
  return Response.json(
    { error: error instanceof ChatStorageError ? error.message : "Samtalehistorikken er midlertidig utilgjengelig." },
    { status: error instanceof ChatStorageError ? error.status : 503, headers: { "Cache-Control": "private, no-store" } },
  );
}

export function isChatThreadId(value: string) {
  return threadPattern.test(value);
}

export function chatSession(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  const name = secure ? "__Host-utekos_chat" : "utekos_chat";
  const value = request.headers.get("cookie")?.split(";")
    .map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  const token = value && sessionPattern.test(value) ? value : randomBytes(32).toString("hex");
  return {
    token,
    headers: {
      "Cache-Control": "private, no-store",
      "Set-Cookie": `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure ? "; Secure" : ""}`,
    },
  };
}

export function isSameOriginChatRequest(request: Request) {
  const origin = request.headers.get("origin");
  return request.headers.get("sec-fetch-site") !== "cross-site"
    && (!origin || origin === new URL(request.url).origin);
}

type Transcript = { messages: ModelMessage[]; version: number };

export function createChatPersistence(sessionToken: string, fetcher = fetch): ChatTranscriptPersistence {
  if (!sessionPattern.test(sessionToken)) throw new ChatStorageError(401);
  // The existing WhatsApp variables hold this project's publishable key, not
  // an ingress secret. CHAT_* permits an independent project configuration.
  const url = process.env.CHAT_SUPABASE_URL ?? process.env.WHATSAPP_SUPABASE_URL;
  const key = process.env.CHAT_SUPABASE_PUBLISHABLE_KEY ?? process.env.WHATSAPP_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ChatStorageError();
  const endpoint = new URL("/rest/v1/rpc/chat_transcript", url);
  const requestHeaders = { "Content-Type": "application/json", apikey: key, "x-utekos-chat-session": sessionToken };
  const versions = new Map<string, number>();

  async function rpc(threadId: string, messages?: ModelMessage[]): Promise<Transcript> {
    if (!isChatThreadId(threadId)) throw new ChatStorageError(400);
    const result = await fetcher(endpoint, {
      method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
      headers: requestHeaders,
      body: JSON.stringify({
        p_thread_id: threadId,
        ...(messages === undefined ? {} : { p_messages: messages, p_expected_version: versions.get(threadId) }),
      }),
    });
    if (!result.ok) throw new ChatStorageError(result.status === 409 ? 409 : 503);
    const data: Transcript = await result.json();
    if (!Array.isArray(data.messages) || !Number.isSafeInteger(data.version) || data.version < 0) {
      throw new ChatStorageError();
    }
    versions.set(threadId, data.version);
    return data;
  }

  return {
    stores: {
      messages: {
        async loadThread(threadId) { return (await rpc(threadId)).messages; },
        async saveThread(threadId, messages) {
          if (!versions.has(threadId)) await rpc(threadId);
          await rpc(threadId, messages);
        },
      },
    },
  };
}
