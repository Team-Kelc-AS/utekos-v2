import { chat, toServerSentEventsResponse } from "@tanstack/ai";

import { anthropicText } from "@tanstack/ai-anthropic";
import { skillDirectory } from "@tanstack/ai-skills/node";
import { withSkills } from "@tanstack/ai-skills";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = chat({
    adapter: anthropicText("claude-sonnet-4-5"),
    messages,
    middleware: [withSkills(skillDirectory("./skills"))],
  });

  return toServerSentEventsResponse(stream);
}
