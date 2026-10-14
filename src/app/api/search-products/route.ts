import {
  chat,
  chatParamsFromRequest,
  toServerSentEventsResponse,
} from "@tanstack/ai";

import { openaiText } from "@tanstack/ai-openai";
import { searchProducts } from "@/assets/components/chat/serverToolDefinition";

export async function POST(request: Request) {
  let params;
  try {
    params = await chatParamsFromRequest(request);
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Produktsøket er midlertidig utilgjengelig." },
      { status: 503 },
    );
  }

  const abortController = new AbortController();
  const stream = chat({
    adapter: openaiText("gpt-5.5"),
    messages: params.messages,
    threadId: params.threadId,
    runId: params.runId,
    resume: params.resume,
    abortController,
    tools: [searchProducts],
  });

  return toServerSentEventsResponse(stream, { abortController });
}
