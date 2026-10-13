"use client";

import type { UIMessage } from "@tanstack/ai-client";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import { MessageScrollerItem } from "@/components/ui/message-scroller";

export function MessageAnimated({ message, scrollAnchor = false }: {
  message: UIMessage;
  scrollAnchor?: boolean;
}) {
  const align = message.role === "user" ? "end" : "start";
  return (
    <MessageScrollerItem messageId={message.id} scrollAnchor={scrollAnchor}>
      <Message align={align} className="motion-safe:animate-in motion-safe:fade-in-0">
        <MessageContent>
          {message.parts.map((part, index) => {
            if (part.type === "text") return (
              <Bubble key={index} align={align} variant={align === "end" ? "secondary" : "ghost"}>
                <BubbleContent className="whitespace-pre-wrap">{part.content}</BubbleContent>
              </Bubble>
            );
            if (part.type === "thinking") return (
              <details key={index}><summary>Resonnering</summary><p>{part.content}</p></details>
            );
            return null;
          })}
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}
