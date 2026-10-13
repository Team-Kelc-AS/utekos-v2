import type { ChatMiddleware } from "@tanstack/ai";

export const lowEffort: ChatMiddleware = {
  name: "low-effort",
  onConfig: (_ctx, config) => ({
    modelOptions: {
      ...config.modelOptions,
      reasoning: { effort: "low", summary: "auto" },
    },
  }),
};
