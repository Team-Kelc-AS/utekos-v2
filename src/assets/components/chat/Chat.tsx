"use client";

import { useEffect, useState } from "react";
import { MCPAppResource } from "@tanstack/ai-react/mcp-apps";
import {
  fetchServerSentEvents,
  useChat,
} from "@tanstack/ai-react";

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
