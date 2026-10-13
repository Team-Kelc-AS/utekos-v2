"use client";

import {
  createChatClientOptions,
  fetchServerSentEvents,
  type InferChatMessages,
} from "@tanstack/ai-react";
import { saveToLocalStorageDef, updateUIDef } from "./clientTools";

type Notification = { message: string; type: "success" | "error" | "info" };

export function createClientChatOptions(onNotification: (value: Notification) => void) {
  const updateUI = updateUIDef.client((input) => {
    onNotification(input);
    return { success: true };
  });
  const saveToLocalStorage = saveToLocalStorageDef.client(({ key, value }) => {
    localStorage.setItem(key, value);
    return { saved: true };
  });
  return createChatClientOptions({
    connection: fetchServerSentEvents("/api/chat"),
    tools: [updateUI, saveToLocalStorage],
  });
}

export type Messages = InferChatMessages<ReturnType<typeof createClientChatOptions>>;
