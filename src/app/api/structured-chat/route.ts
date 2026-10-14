import {
  chat,
  chatParamsFromRequest,
  toServerSentEventsResponse,
} from "@tanstack/ai";

import { RecipeSchema } from "@/assets/components/chat/config/RecipeSchema";
import { openaiText } from "@tanstack/ai-openai";

export async function POST(request: Request) {
  let params;
  try {
    params = await chatParamsFromRequest(request);
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
  if (!process.env.OPENAI_API_KEY)
    return Response.json(
      { error: "Chat er ikke konfigurert." },
      { status: 503 },
    );
  const abortController = new AbortController();
  return toServerSentEventsResponse(
    chat({
      adapter: openaiText("gpt-5.5"),
      messages: params.messages,
      threadId: params.threadId,
      runId: params.runId,
      abortController,
      systemPrompts: [
        "You are a chef assistant. Respond with a recipe matching the JSON schema. For modifications, produce the complete updated recipe.",
      ],
      outputSchema: RecipeSchema,
      stream: true,
    }),
    { abortController },
  );
}
