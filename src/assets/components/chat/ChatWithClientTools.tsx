"use client";

import { useChat } from "@tanstack/ai-react";
import { useMemo, useState } from "react";
import { createClientChatOptions } from "./createChatClientOptions";
import { MessageComponent } from "./MessageComponent";

export function ChatWithClientTools() {
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const options = useMemo(() => createClientChatOptions(setNotification), []);
  const { messages, sendMessage, isLoading, error } = useChat(options);

  return (
    <div>
      {notification && <p role="status">{notification.message}</p>}
      {messages.map((message) => <MessageComponent key={message.id} message={message} />)}
      {error && <p role="alert">Meldingen kunne ikke sendes. Prøv igjen.</p>}
      <form onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const message = String(new FormData(form).get("message") ?? "").trim();
        if (!message || isLoading) return;
        void sendMessage(message).then(() => form.reset()).catch(() => undefined);
      }}>
        <label>Melding<input name="message" required disabled={isLoading} /></label>
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
