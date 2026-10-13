import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import { inlineSkill, withSkills } from "@tanstack/ai-skills";

import { anthropicText } from "@tanstack/ai-anthropic";

const pptx = inlineSkill({
  name: "pptx-builder",
  description: "Build and edit PowerPoint decks with python-pptx.",
  instructions: "# Building a deck\nUse python-pptx. Edit slides, then save.",
});

const brand = inlineSkill({
  name: "brand-voice",
  description: "Write in the company brand voice.",
  instructions: "# Brand voice\nWarm, direct, no jargon.",
});

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = chat({
    adapter: anthropicText("claude-sonnet-4-5"),
    messages,
    middleware: [withSkills([pptx, brand])],
  });

  return toServerSentEventsResponse(stream);
}
