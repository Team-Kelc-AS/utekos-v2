import type { ChatMiddleware } from "@tanstack/ai";
import type { OpenAITextProviderOptions } from "@tanstack/ai-openai";

// Force the tool on the first model call, then release the override.
export const weatherFirst: ChatMiddleware = {
  name: "weather-first",
  onConfig: (ctx, config) => {
    if (ctx.phase !== "beforeModel") return;

    const toolChoice: OpenAITextProviderOptions["tool_choice"] =
      ctx.iteration === 0 ? { type: "function", name: "get_weather" } : "auto";
    return {
      modelOptions: {
        ...config.modelOptions,
        tool_choice: toolChoice,
      },
    };
  },
};
