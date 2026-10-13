import type { Messages } from "./createChatClientOptions";

export function MessageComponent({ message }: { message: Messages[number] }) {
  return (
    <div>
      {message.parts.map((part, index) => {
        if (part.type === "text") return <p key={index}>{part.content}</p>;
        if (part.type === "tool-call" && part.name === "update_ui") {
          return <div key={part.id}>
            Tool: {part.name}
            {part.output?.success && <span>✓ Success</span>}
          </div>;
        }
        return null;
      })}
    </div>
  );
}
