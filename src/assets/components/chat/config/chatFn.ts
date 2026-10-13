import "server-only";

import { chat, toServerSentEventsResponse } from "@tanstack/ai";

import type { UIMessage } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";

// Call from a Next.js Route Handler; Response streams are not Server Actions.
export function chatFn({ data }: { data: { messages: Array<UIMessage> } }) {
  return toServerSentEventsResponse(
    chat({ adapter: openaiText("gpt-5.6"), messages: data.messages }),
  );
}
