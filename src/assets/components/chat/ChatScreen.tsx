"use client";

import { fetchServerSentEvents } from "@tanstack/ai-react";
import { createChatHook } from "@tanstack/ai-react/ui";
import type { ReactElement } from "react";

const options = { connection: fetchServerSentEvents("/api/chat"), persistence: true };
const { useAppChat, useChatContext } = createChatHook<typeof options, typeof ChatInput>({
  options,
  components: {
    layout: ({ Messages, Input }) => <section><Messages /><Input /></section>,
    message: ({ message, Parts }) => <article data-role={message.role}><Parts /></article>,
    input: ChatInput,
  },
  partsComponents: {
    text: ({ part }) => <p>{part.content}</p>,
    fallback: () => null,
  },
});

function ChatInput(): ReactElement {
  const chat = useChatContext();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const message = String(new FormData(form).get("message") ?? "").trim();
        if (!message || chat.isLoading || chat.isHydrating) return;
        void chat.sendMessage(message).then(() => form.reset()).catch(() => undefined);
      }}
    >
      <label>Melding<input name="message" required disabled={chat.isLoading || chat.isHydrating} /></label>
      <button type="submit" disabled={chat.isLoading || chat.isHydrating}>Send</button>
      {chat.error && <p role="alert">Meldingen kunne ikke sendes. Prøv igjen.</p>}
    </form>
  );
}

export function ChatScreen() {
  const chat = useAppChat({ threadId: "support-1" });
  return <chat.AppChat />;
}
