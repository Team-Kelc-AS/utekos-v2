"use client";

import { usePageWebMCPTools } from "@tanstack/ai-react";

export function useSameOriginPageTools() {
  return usePageWebMCPTools({
    filter: (tool) => typeof window !== "undefined" && tool.origin === window.location.origin,
  });
}
