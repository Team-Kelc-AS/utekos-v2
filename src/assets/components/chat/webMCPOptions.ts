"use client";

import { createElement } from "react";
import { useRegisterWebMCPTools } from "@tanstack/ai-react";
import { webMCPTools } from "./openHelpPanel";

const webMCPOptions = {
  onError(error: unknown) {
    console.error("WebMCP registration failed", error);
  },
};

export function HelpPage() {
  useRegisterWebMCPTools(webMCPTools, webMCPOptions);

  return createElement(
    "section",
    { id: "help-panel", popover: "auto" },
    createElement("h2", null, "Help"),
  );
}
