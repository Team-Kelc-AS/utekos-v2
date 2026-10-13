"use client";

import { fetchServerSentEvents, useChat, useRegisterWebMCPTools } from "@tanstack/ai-react";
import { webMCPTools } from "./openHelpPanel";
import { searchProducts } from "./searchProductsClient";

const tools = [...webMCPTools, searchProducts];
const connection = fetchServerSentEvents("/api/chat");
const registrationOptions = {
  onError(error: unknown) { console.error("WebMCP registration failed", error); },
};

export function ProductPageChat() {
  useRegisterWebMCPTools(tools, registrationOptions);
  const { messages, sendMessage, isLoading, isHydrating, error } = useChat({
    connection, tools, threadId: "support-products", persistence: true,
  });
  const isBusy = isLoading || isHydrating;

  return (
    <div>
      <button type="button" disabled={isBusy} onClick={() => {
        document.getElementById("help-panel")?.showPopover();
        void sendMessage("Åpne hjelpepanelet").catch(() => undefined);
      }}>
        Spør oss ({messages.length} meldinger)
      </button>
      <section id="help-panel" popover="auto" aria-label="Handlehjelp">
        <h2>Handlehjelp</h2>
        {messages.map((message) => <div key={message.id}>
          {message.parts.map((part, index) => part.type === "text"
            ? <p key={index}>{part.content}</p> : null)}
        </div>)}
        {error && <p role="alert">Handlehjelpen er midlertidig utilgjengelig.</p>}
        <form onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const message = String(new FormData(form).get("message") ?? "").trim();
          if (!message || isBusy) return;
          void sendMessage(message).then(() => form.reset()).catch(() => undefined);
        }}>
          <label>Melding<input name="message" required disabled={isBusy} /></label>
          <button type="submit" disabled={isBusy}>Send</button>
        </form>
      </section>
    </div>
  );
}
