import "server-only";

import type { ModelMessage } from "@tanstack/ai";
import { chat } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";

export function runTurn(messages: Array<ModelMessage>) {
  return chat({ adapter: openaiText("gpt-5.6"), messages });
}
