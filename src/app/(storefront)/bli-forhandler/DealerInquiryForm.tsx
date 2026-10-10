"use client";

import { useActionState, useEffect, useRef } from "react";
import { emitStorefrontAction } from "@/lib/tracking/browser-events";
import { submitDealerInquiry } from "./actions";
import { initialDealerInquiryState, type DealerInquiryValues } from "./form-state";
import styles from "../kontaktskjema/contact.module.css";

export default function DealerInquiryForm() {
  const [state, formAction, pending] = useActionState(submitDealerInquiry, initialDealerInquiryState, "/bli-forhandler");
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "idle") return;
    if (state.status === "success" && state.leadEvent) emitStorefrontAction("utekos:accepted-lead", state.leadEvent);
    if (state.status === "error") emitStorefrontAction("utekos:form-error", { formId: "dealer_inquiry", attemptId: crypto.randomUUID(), category: state.errors ? "validation" : "submission_failed" });
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (invalid ?? statusRef.current)?.focus();
  }, [state]);

  function fieldError(name: keyof DealerInquiryValues) {
    const message = state.errors?.[name]?.[0];
    return message ? <p className={styles.error} id={`dealer-${name}-error`}>{message}</p> : null;
  }
  function fieldProps(name: keyof DealerInquiryValues, hint?: string) {
    const invalid = Boolean(state.errors?.[name]?.length);
    return {
      id: `dealer-${name}`, name, "aria-invalid": invalid || undefined,
      "aria-describedby": [hint, invalid ? `dealer-${name}-error` : undefined].filter(Boolean).join(" ") || undefined,
    };
  }

  return (
    <>
      <div ref={statusRef} tabIndex={-1} role="status" className={state.message ? styles.status : undefined}>
        {state.message}
        {state.status === "success" && <p><a href="/bli-forhandler">Send en ny henvendelse</a></p>}
      </div>
      {state.status !== "success" && (
        <form ref={formRef} action={formAction} data-tracking-form="dealer_inquiry" data-tracking-form-name="Forhandlersamarbeid" noValidate aria-busy={pending} className={styles.form}>
          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="dealer-website">La dette feltet stå tomt</label>
            <input id="dealer-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <fieldset key={state.attempt} disabled={pending} className={styles.fields}>
            <legend className={styles.visuallyHidden}>Din henvendelse om forhandlersamarbeid</legend>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="dealer-storeName">Butikknavn</label>
                <input {...fieldProps("storeName")} autoComplete="organization" required minLength={2} maxLength={150} defaultValue={state.values.storeName} />
                {fieldError("storeName")}
              </div>
              <div className={styles.field}>
                <label htmlFor="dealer-location">Sted</label>
                <input {...fieldProps("location")} autoComplete="address-level2" required minLength={2} maxLength={150} defaultValue={state.values.location} />
                {fieldError("location")}
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="dealer-name">Kontaktperson</label>
                <input {...fieldProps("name")} autoComplete="name" required minLength={2} maxLength={100} defaultValue={state.values.name} />
                {fieldError("name")}
              </div>
              <div className={styles.field}>
                <label htmlFor="dealer-email">E-post</label>
                <input {...fieldProps("email")} type="email" autoComplete="email" required maxLength={254} defaultValue={state.values.email} />
                {fieldError("email")}
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="dealer-phone">Telefonnummer</label>
              <input {...fieldProps("phone")} type="tel" autoComplete="tel" required maxLength={40} defaultValue={state.values.phone} />
              {fieldError("phone")}
            </div>
            <div className={styles.field}>
              <label htmlFor="dealer-message">Melding</label>
              <p id="dealer-message-hint" className={styles.hint}>Fortell litt om butikken din og hva dere ønsker å vite om et samarbeid. (10–5000 tegn)</p>
              <textarea {...fieldProps("message", "dealer-message-hint")} rows={6} required minLength={10} maxLength={5000} defaultValue={state.values.message} />
              {fieldError("message")}
            </div>
            <div>
              <label className={styles.checkbox}>
                <input {...fieldProps("privacy")} type="checkbox" required defaultChecked={state.values.privacy} />
                <span>Jeg har lest <a href="/personvern" target="_blank" rel="noopener">personvernerklæringen (åpnes i ny fane)</a>. Opplysningene brukes til å behandle henvendelsen.</span>
              </label>
              {fieldError("privacy")}
            </div>
            <button type="submit" data-tracking-cta="dealer_web_submit" disabled={pending} className={styles.submit}>{pending ? "Sender meldingen …" : "Ta kontakt om forhandlersamarbeid"}</button>
          </fieldset>
        </form>
      )}
    </>
  );
}
