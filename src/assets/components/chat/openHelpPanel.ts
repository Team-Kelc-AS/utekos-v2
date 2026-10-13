// tools.ts
import { toolDefinition } from "@tanstack/ai/client";
import { z } from "zod";

export const openHelpPanelDef = toolDefinition({
  name: "open_help_panel",
  description: "Open the help panel for a topic",
  inputSchema: z.object({
    topic: z.string(),
  }),
  outputSchema: z.object({
    opened: z.boolean(),
  }),
});

export const openHelpPanel = openHelpPanelDef.client((input) => {
  const panel = document.querySelector<HTMLElement>("#help-panel");
  if (!panel) {
    return { opened: false };
  }

  panel.dataset.topic = input.topic;
  panel.showPopover();
  return { opened: true };
});

export const webMCPTools = [openHelpPanel];
