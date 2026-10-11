"use client";

import { useActionState, useId } from "react";
import { subscribeToNewsletter, type NewsletterState } from "@/lib/newsletter/subscribe";
import styles from "./Newsletter.module.css";

const initialState: NewsletterState = { status: "idle", message: "", email: "" };

export default function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initialState);
  const id = useId();

  return (
    <form action={action} className={styles.form} data-tracking-form="newsletter_signup" aria-busy={pending}>
      <div className={styles.fields}>
        <label htmlFor={`${id}-email`} className={styles.srOnly}>Din e-postadresse</label>
        <input
          id={`${id}-email`}
          className={styles.input}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Din e-postadresse…"
          maxLength={254}
          required
          defaultValue={state.email}
          aria-invalid={state.invalidEmail || undefined}
          aria-describedby={`${id}-feedback`}
        />
        <div className={styles.srOnly} aria-hidden="true">
          <label htmlFor={`${id}-website`}>Nettside</label>
          <input id={`${id}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <button className={styles.button} type="submit" disabled={pending}>
          {pending ? "Sender…" : "Meld meg inn"}
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <div id={`${id}-feedback`} className={styles.feedback} aria-live="polite" aria-atomic="true">
        {state.message && !pending && (
          <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
        )}
      </div>
    </form>
  );
}
