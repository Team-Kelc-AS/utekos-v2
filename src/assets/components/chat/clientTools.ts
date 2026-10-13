// tools/definitions.ts - Shared between server and client
import { toolDefinition } from "@tanstack/ai/client";
import { z } from "zod";

export const updateUIDef = toolDefinition({
  name: "update_ui",
  description: "Update the UI with new information",
  inputSchema: z.object({
    message: z.string().meta({ description: "Message to display" }),
    type: z
      .enum(["success", "error", "info"])
      .meta({ description: "Message type" }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
  }),
});

export const saveToLocalStorageDef = toolDefinition({
  name: "save_to_local_storage",
  description: "Save data to browser local storage",
  inputSchema: z.object({
    key: z.string().meta({ description: "Storage key" }),
    value: z.string().meta({ description: "Value to store" }),
  }),
  outputSchema: z.object({
    saved: z.boolean(),
  }),
});
