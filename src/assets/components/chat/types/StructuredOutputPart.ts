import type { DeepPartial } from "@tanstack/ai";

export type StructuredOutputPart<TData> = {
  type: "structured-output";
  status: "streaming" | "complete" | "error";
  /** Progressive parse of `raw` — populated while streaming and after complete. */
  partial?: DeepPartial<TData>;
  /** Completed typed object — set when `status === "complete"`. */
  data?: TData;
  /** Accumulating JSON text. Round-trip source of truth for the next turn. */
  raw: string;
  /** Optional reasoning tokens surfaced by thinking models. */
  reasoning?: string;
  /** Set when `status === "error"`. */
  errorMessage?: string;
};
