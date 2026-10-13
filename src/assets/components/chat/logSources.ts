import type { UIMessage } from "@tanstack/ai";
import { getProviderExecutedMetadata } from "@tanstack/ai";

export function logSources(message: UIMessage) {
  for (const part of message.parts) {
    if (part.type !== "tool-call") continue;
    const sources = getProviderExecutedMetadata(part)?.sources ?? [];
    for (const source of sources) {
      console.log(source.title ?? source.url, source.url);
    }
  }
}
