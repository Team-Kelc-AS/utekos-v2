import {
  chat,
  chatParamsFromRequest,
  toServerSentEventsResponse,
} from "@tanstack/ai";

import { geminiText } from "@tanstack/ai-gemini";
import { withPersistence } from "@tanstack/ai-persistence";
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
  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "Handlehjelpen er midlertidig utilgjengelig." }, { status: 503 });
  }
  if (!isChatThreadId(params.threadId)) return new Response(null, { status: 400 });
  const session = chatSession(request);
  let persistence;
  try {
    persistence = createChatPersistence(session.token);
    await persistence.stores.messages.loadThread(params.threadId);
  } catch (error) {
    return chatStorageResponse(error);
  }
  const abortController = new AbortController();
  const stream = chat({
    adapter: geminiText("gemini-2.5-pro"),
    messages: params.messages,
    threadId: params.threadId,
    runId: params.runId,
    resume: params.resume,
    abortController,
    modelOptions: { thinkingConfig: { thinkingBudget: 8000 } },
    middleware: [withPersistence(persistence, { snapshotStreaming: true })],
  });
  return toServerSentEventsResponse(stream, { abortController, headers: session.headers });
}
