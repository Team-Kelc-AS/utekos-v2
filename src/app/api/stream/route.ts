import {
  chat,
  toServerSentEventsResponse,
  toolDefinition,
} from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { z } from "zod";
import { weatherFirst } from "@/assets/components/chat/weatherFirst";

const getWeather = toolDefinition({
  name: "get_weather",
  description: "Get the current weather for a city",
  inputSchema: z.object({ city: z.string() }),
}).server(async ({ city }) => ({ city, temperature: 21 }));

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = chat({
    adapter: openaiText("gpt-6.1-sol"),
    messages,
    tools: [getWeather],
    middleware: [weatherFirst],
  });

  return toServerSentEventsResponse(stream);
}
