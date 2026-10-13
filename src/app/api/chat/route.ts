import {
  chat,
  chatParamsFromRequest,
  mergeAgentTools,
  toServerSentEventsResponse,
} from "@tanstack/ai";

import { openaiText } from "@tanstack/ai-openai";
import { withPersistence } from "@tanstack/ai-persistence";
import { searchProducts } from "@/assets/components/chat/serverToolDefinition";
import { chatSession, chatStorageResponse, createChatPersistence, isChatThreadId, isSameOriginChatRequest } from "@/lib/chat/persistence";
export { loadChatHistory as GET } from "@/lib/chat/history";

export async function POST(request: Request) {
  if (!isSameOriginChatRequest(request)) return new Response(null, { status: 403 });
  let params;
  try {
    params = await chatParamsFromRequest(request);
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Handlehjelpen er midlertidig utilgjengelig." },
      { status: 503 },
    );
  }

  const abortController = new AbortController();
  if (!isChatThreadId(params.threadId)) return new Response(null, { status: 400 });
  const session = chatSession(request);
  let persistence;
  try {
    persistence = createChatPersistence(session.token);
    // Fail before starting a paid model request if storage is unavailable.
    await persistence.stores.messages.loadThread(params.threadId);
  } catch (error) {
    return chatStorageResponse(error);
  }
  const stream = chat({
    adapter: openaiText("gpt-6.1-sol"),
    messages: params.messages,
    threadId: params.threadId,
    runId: params.runId,
    // GPT-6.1 caches automatically with its default 30-minute minimum TTL.
    modelOptions: { prompt_cache_key: "acme-support" },
    resume: params.resume,
    abortController,
    tools: mergeAgentTools([searchProducts], params.tools),
    middleware: [withPersistence(persistence, { snapshotStreaming: true })],
  });

  return toServerSentEventsResponse(stream, { abortController, headers: session.headers });
}
