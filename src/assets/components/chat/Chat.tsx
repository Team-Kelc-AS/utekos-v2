"use client";

import { useEffect, useState } from "react";
import { MCPAppResource } from "@tanstack/ai-react/mcp-apps";
import { createChat } from "@shadcn/helpers/tanstack-ai";
import {
  fetchServerSentEvents,
  useChat,
} from "@tanstack/ai-react";

const chat = createChat()
  .user("Hva er 3 i 1 funksjonalitet?")
  .assistant(
    "En gjennomtestet løsning som lar deg sømløst justere Utekos-modellene, og veksle  mellom ulike funksjonelle moduser. Utekos-modellene fra fulldekket, parkas og oppfestet til .",
  )
  .user("Hvordan bruker jeg snarveiene?")
  .assistant("Trykk ⌘K for å søke og ⌘Enter for å sende.");

const initialMessages = chat.get(0);
const connection = chat.transport();

export function Chat({ sandboxUrl }: { sandboxUrl?: string } = {}) {
  const [restoredBatch, setRestoredBatch] = useState(false);
  const { messages, sendMessage, isLoading, isHydrating, error, cancelInterrupts } = useChat({
    threadId: "support-chat",
    connection: fetchServerSentEvents("/api/chat"),
    persistence: true,
    onInterruptStateChange(_state, { source }) {
      setRestoredBatch(source === "hydrate");
    },
  });

  useEffect(() => {
    if (restoredBatch) cancelInterrupts();
  }, [cancelInterrupts, restoredBatch]);

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          {m.parts.map((part, i) => {
            if (part.type === "text") {
              return <p key={i}>{part.content}</p>;
            }
            if (part.type === "ui-resource") {
              if (!sandboxUrl)
                return <p key={i}>Forhåndsvisning er ikke konfigurert.</p>;
              return (
                <MCPAppResource
                  key={i}
                  part={part}
                  sandbox={{ url: new URL(sandboxUrl) }}
                />
              );
            }
            return null;
          })}
        </div>
      ))}
      {error && <p role="alert">Meldingen kunne ikke sendes. Prøv igjen.</p>}
      <button
        onClick={() => {
          void sendMessage({ content: "Show me the weather widget" }).catch(
            () => undefined,
          );
        }}
        disabled={isLoading || isHydrating}
      >
        Send
      </button>
    </div>
  );
}
export function ScriptedChat() {
  const { messages, append, status } = useChat({
    initialMessages,
    connection,
  });
  const nextMessage = chat.next(messages);
  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.parts.map((part, index) =>
            part.type === "text" ? <p key={index}>{part.content}</p> : null,
          )}
        </div>
      ))}
      <button
        disabled={!nextMessage || isBusy}
        onClick={() => {
          if (nextMessage && !isBusy) {
            void append(nextMessage);
          }
        }}
      >
        Send
      </button>
    </div>
  );
}

