"use client";

import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { useMemo } from "react";
import { createAddToCartClient, type CartToolHandler } from "./tools";

export function CartChat({ addToCart }: { addToCart: CartToolHandler }) {
  const tools = useMemo(() => [createAddToCartClient(addToCart)], [addToCart]);
  const { messages } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    tools,
  });

  return <div>{messages.flatMap((message) => message.parts.map((part) =>
    part.type === "tool-call" && part.name === "add_to_cart" && part.output
      ? <p key={part.id}>{part.output.success ? "Handlekurven er oppdatert." : "Handlekurven kunne ikke oppdateres."}</p>
      : null,
  ))}</div>;
}
