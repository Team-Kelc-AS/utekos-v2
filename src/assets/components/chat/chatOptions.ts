"use client";

import { createChatClientOptions, fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { toolDefinition } from "@tanstack/ai/client";

type ClientContext = {
  activeProjectId: string;
  toast(message: string): void;
};

const showToast = toolDefinition({
  name: "show_toast",
  description: "Show a browser notification",
}).client<ClientContext>((_input, ctx) => {
  ctx.context.toast(`Project ${ctx.context.activeProjectId} updated`);
  return { ok: true };
});

export function createNotificationChatOptions(context: ClientContext) {
  return createChatClientOptions({
    connection: fetchServerSentEvents("/api/chat"),
    tools: [showToast],
    context,
  });
}

export function useNotificationChat(context: ClientContext) {
  return useChat(createNotificationChatOptions(context));
}
