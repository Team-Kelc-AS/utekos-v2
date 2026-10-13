import "server-only";

import { reconstructChat } from "@tanstack/ai-persistence";
import {
  chatSession, chatStorageResponse, createChatPersistence,
  isChatThreadId, isSameOriginChatRequest,
} from "./persistence";

export async function loadChatHistory(request: Request) {
  if (!isSameOriginChatRequest(request)) return new Response(null, { status: 403 });
  const url = new URL(request.url);
  // Transcript persistence does not keep a producer running after disconnect.
  // A stale delivery cursor must not silently start another model request.
  if (request.headers.has("Last-Event-ID") || url.searchParams.has("offset")) {
    return Response.json({ error: "Strømmen er avsluttet. Last samtalehistorikken på nytt." },
      { status: 410, headers: { "Cache-Control": "private, no-store" } });
  }
  const threadId = url.searchParams.get("threadId") ?? "";
  if (!isChatThreadId(threadId)) return new Response(null, { status: 400 });
  const session = chatSession(request);
  try {
    const response = await reconstructChat(createChatPersistence(session.token), request);
    Object.entries(session.headers).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  } catch (error) {
    return chatStorageResponse(error);
  }
}
