"use client";

import { emitStorefrontAction } from "@/lib/tracking/browser-events";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitContactForm } from "./actions";
import ContactAttachments, { syncAttachmentInput } from "./ContactAttachments";
import { initialContactState, type ContactValues } from "./form-state";
import styles from "./contact.module.css";

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, initialContactState, "/kontaktskjema");
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    syncAttachmentInput(attachmentRef.current, attachments);
  }, [attachments, state.attempt]);

  useEffect(() => {
    if (state.status === "idle") return;
    if (state.status === "error") emitStorefrontAction("utekos:form-error", { formId: "contact", attemptId: crypto.randomUUID(), category: state.errors ? "validation" : "submission_failed" });
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (invalid ?? statusRef.current)?.focus();
  }, [state]);

  function fieldError(name: keyof ContactValues) {
    const message = state.errors?.[name]?.[0];
    return message ? <p className={styles.error} id={`${name}-error`}>{message}</p> : null;
  }

  function fieldProps(name: keyof ContactValues, hint?: string) {
    const invalid = Boolean(state.errors?.[name]?.length);
    return {
      id: name, name, "aria-invalid": invalid || undefined,
      "aria-describedby": [hint, invalid ? `${name}-error` : undefined].filter(Boolean).join(" ") || undefined,
    };
  }

  return (
    <>
      <div ref={statusRef} tabIndex={-1} role="status" className={state.message ? styles.status : undefined}>
        {state.message}
        {state.status === "success" && <p><a href="/kontaktskjema">Send en ny henvendelse</a></p>}
      </div>
      {state.status !== "success" && (
        <form data-tracking-form="contact" data-tracking-form-name="Kontaktskjema" ref={formRef} action={formAction} onSubmit={() => syncAttachmentInput(attachmentRef.current, attachments)} noValidate aria-busy={pending} className={styles.form}>
          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="website">La dette feltet stå tomt</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <fieldset key={state.attempt} disabled={pending} className={styles.fields}>
            <legend className={styles.visuallyHidden}>Din henvendelse til Utekos</legend>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="name">Navn</label>
                <input {...fieldProps("name")} autoComplete="name" required minLength={2} maxLength={100} defaultValue={state.values.name} />
                {fieldError("name")}
              </div>
              <div className={styles.field}>
                <label htmlFor="email">E-post</label>
                <input {...fieldProps("email")} type="email" autoComplete="email" required maxLength={254} defaultValue={state.values.email} />
                {fieldError("email")}
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="orderNumber">Ordrenummer <span>(valgfritt)</span></label>
                <input {...fieldProps("orderNumber")} maxLength={80} defaultValue={state.values.orderNumber} />
                {fieldError("orderNumber")}
              </div>
              <div className={styles.field}>
                <label htmlFor="phone">Telefon <span>(valgfritt)</span></label>
                <input {...fieldProps("phone")} type="tel" autoComplete="tel" maxLength={40} defaultValue={state.values.phone} />
                {fieldError("phone")}
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="message">Hva kan vi hjelpe deg med?</label>
              <p id="message-hint" className={styles.hint}>Beskriv spørsmålet ditt. Ved produktvalg: fortell hvor og når du vil bruke plagget. 10–5000 tegn.</p>
              <textarea {...fieldProps("message", "message-hint")} rows={7} required minLength={10} maxLength={5000} defaultValue={state.values.message} />
              {fieldError("message")}
            </div>
            <ContactAttachments files={attachments} onChange={setAttachments} inputRef={attachmentRef} error={state.errors?.attachments?.[0]} pending={pending} />
            <div>
              <label className={styles.checkbox}>
                <input {...fieldProps("privacy")} type="checkbox" required defaultChecked={state.values.privacy} />
                <span>Jeg har lest <a href="https://utekos.no/personvern" target="_blank" rel="noopener">personvernerklæringen (åpnes i ny fane)</a>. Opplysningene brukes til å behandle henvendelsen.</span>
              </label>
              {fieldError("privacy")}
            </div>
            <button type="submit" disabled={pending} className={styles.submit}>{pending ? "Sender meldingen …" : "Send melding"}</button>
          </fieldset>
        </form>
      )}
    </>
  );
}
