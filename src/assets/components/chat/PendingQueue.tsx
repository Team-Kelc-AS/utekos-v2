"use client";

import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";

export function PendingQueue() {
  const { queue, cancelQueued } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });
  return (
    <>
      {queue.map((item) => (
        <div key={item.id} className="pending">
          {typeof item.content === "string" ? item.content : "[attachment]"}
          <button onClick={() => cancelQueued(item.id)}>Cancel</button>
        </div>
      ))}
    </>
  );
}
