"use client";

import type { FileHandle } from "@tanstack/ai/client";
import { fetchServerSentEvents } from "@tanstack/ai-client";
import { fileSourceFromHandle } from "@tanstack/ai/client";
import { useChat } from "@tanstack/ai-react";

// `handle` came from your upload endpoint and is stored client-side.
export function AskAboutFile({ handle }: { handle: FileHandle }) {
  const { sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  return (
    <>
      <button
        disabled={isLoading}
        onClick={() => {
          void sendMessage({
            content: [
              { type: "text", content: "Describe this" },
              { type: "image", source: fileSourceFromHandle(handle) },
            ],
          }).catch(() => undefined);
        }}
        type="button"
      >
        Ask
      </button>
      {error && <p role="alert">Meldingen kunne ikke sendes. Prøv igjen.</p>}
    </>
  );
}
