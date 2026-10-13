"use client";

import { useState } from "react";
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";
import type { StructuredOutputPart } from "@tanstack/ai-client";
import { RecipeSchema, type Recipe } from "./RecipeSchema";

// The schema-typed structured-output part. Pulled out so the find()
// predicate below stays readable.
type RecipePart = StructuredOutputPart<Recipe>;

export function StructuredChatPage() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, isLoading, error } = useChat({
    outputSchema: RecipeSchema,
    connection: fetchServerSentEvents("/api/structured-chat"),
  });

  return (
    <div>
      {messages.map((m) => {
        if (m.role === "user") {
          const text = m.parts
            .filter((p) => p.type === "text")
            .map((p) => p.content)
            .join("");
          return <p key={m.id}>{text}</p>;
        }
        if (m.role === "assistant") {
          // `data` is typed as `Recipe` because the schema generic flows
          // all the way from useChat through messages[i].parts.
          const recipePart = m.parts.find(
            (p): p is RecipePart => p.type === "structured-output",
          );
          if (!recipePart) return null;
          return <RecipeCard key={m.id} part={recipePart} />;
        }
        return null;
      })}

      <input
        aria-label="Melding"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
      />
      <button
        onClick={() => {
          if (!input.trim()) return;
          void sendMessage(input).then(() => setInput("")).catch(() => undefined);
        }}
        disabled={isLoading || !input.trim()}
      >
        Send
      </button>
      {error && <p role="alert">Meldingen kunne ikke sendes. Prøv igjen.</p>}
    </div>
  );
}

function RecipeCard({ part }: { part: RecipePart }) {
  // After you check `part.status === "complete"`, TypeScript knows that
  // `part.data` is a `Recipe`. No `!` or `?.` is necessary.
  // While the model streams the JSON, `partial` is `DeepPartial<Recipe>`.
  const recipe = part.status === "complete" ? part.data : part.partial;

  return (
    <article>
      <h3>{recipe?.title ?? "Plating up…"}</h3>
      {recipe?.cuisine && <p>{recipe?.cuisine}</p>}
      <ul>{recipe?.ingredients?.map((ing, i) => (
        <li key={i}>
          {ing?.amount} {ing?.item}
        </li>
      ))}</ul>
      {part.status === "error" && (
        <p>Failed: {part.errorMessage ?? "Stream failed"}</p>
      )}
    </article>
  );
}
