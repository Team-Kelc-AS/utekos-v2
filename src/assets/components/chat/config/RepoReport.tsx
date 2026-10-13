"use client";

import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";

import { z } from "zod";

const ReportSchema = z.object({
  name: z.string(),
  oneLiner: z.string(),
});
export function RepoReport({ endpoint }: { endpoint: string }) {
  const { messages, sendMessage, isLoading, final, error } = useChat({
    connection: fetchServerSentEvents(endpoint),
    outputSchema: ReportSchema,
  });

  return (
    <>
      <button
        disabled={isLoading}
        onClick={() => { void sendMessage("What is this repository about?").catch(() => undefined); }}
      >
        Run report
      </button>
      {messages.map((message) => (
        <div key={message.id}>
          {message.parts.map((part, index) => {
            if (part.type === "thinking") {
              return <p key={index}>{part.content}</p>;
            }
            if (part.type === "tool-call") {
              return (
                <p key={part.id}>
                  {part.name} ({part.state})
                </p>
              );
            }
            if (part.type === "text") {
              return <p key={index}>{part.content}</p>;
            }
            if (part.type === "structured-output") {
              const report = part.data ?? part.partial;
              return report?.name ? <h2 key={index}>{report.name}</h2> : null;
            }
            return null;
          })}
        </div>
      ))}
      {final ? <p>{final.oneLiner}</p> : null}
      {error && <p role="alert">Rapporten kunne ikke hentes. Prøv igjen.</p>}
    </>
  );
}
