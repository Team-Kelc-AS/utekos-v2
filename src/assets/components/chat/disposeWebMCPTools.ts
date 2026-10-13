"use client";

import { registerWebMCPTools } from "@tanstack/ai-react";
import { webMCPTools } from "./openHelpPanel";

let registration: AbortController | undefined;

// Registration is explicit and can be repeated after disposal.
export async function registerHelpWebMCPTools() {
  disposeWebMCPTools();
  registration = new AbortController();
  await registerWebMCPTools(webMCPTools, {
    signal: registration.signal,
    toolOptions: {
      open_help_panel: {
        title: "Open help",
        annotations: { readOnlyHint: false, untrustedContentHint: false },
      },
    },
  });
}

export function disposeWebMCPTools() {
  registration?.abort();
  registration = undefined;
}
