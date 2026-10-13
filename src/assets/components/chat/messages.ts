import "server-only";

import { chat, type ModelMessage } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { addToCartDef, createAddToCartServer, type CartToolHandler } from "./tools";

// Explicit invocation keeps model calls out of module initialization.
export function createCartChatStream(messages: ModelMessage[], addToCart?: CartToolHandler) {
  return chat({
    adapter: openaiText("gpt-5.5"),
    messages,
    tools: [addToCart ? createAddToCartServer(addToCart) : addToCartDef],
  });
}
