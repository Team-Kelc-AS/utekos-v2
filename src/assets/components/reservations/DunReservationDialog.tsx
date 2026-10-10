'use client';

import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import Dialog from '@/components/commerce/Dialog';
import { Questionnaire, QuestionnaireActions, QuestionnaireChoice, QuestionnaireChoices, QuestionnaireError, QuestionnaireInput, QuestionnaireItem, QuestionnaireNext, QuestionnairePrevious, QuestionnaireProgress, QuestionnaireSubmit, QuestionnaireTitle } from '@/components/ui/questionnaire';
import { emitStorefrontAction } from '@/lib/tracking/browser-events';
import { dunColors, dunSizes, dunReservationConsent, type DunSelection, type DunReservationState } from '@/lib/reservations/dun';
import { submitDunReservation } from '@/lib/reservations/submitDunReservation';
import styles from './dun-reservation.module.css';

const fields = [
  { name: 'firstName', label: 'Fornavn', type: 'text', autoComplete: 'given-name', maxLength: 100 },
  { name: 'lastName', label: 'Etternavn', type: 'text', autoComplete: 'family-name', maxLength: 100 },
  { name: 'email', label: 'E-postadresse', type: 'email', autoComplete: 'email', maxLength: 254 },
  { name: 'phone', label: 'Telefonnummer', type: 'tel', autoComplete: 'tel', maxLength: 40 },
] as const;

export default function DunReservationDialog({ selection, onClose }: { selection: DunSelection; onClose: () => void }) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [item, setItem] = useState('variant');
  const [values, setValues] = useState({ ...selection, firstName: '', lastName: '', email: '', phone: '' });
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<DunReservationState>({ status: 'idle' });
  const [pending, startTransition] = useTransition();
  const items = [
    { name: 'variant', required: true },
    { name: 'contact', required: true },
    { name: 'consent', required: true, choices: [{ value: 'yes', disabled: pending }] },
  ] as const;

  useEffect(() => { if (state.status === 'success') successRef.current?.focus(); }, [state.status]);

  function validateCurrent() {
    const controls = formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-slot="questionnaire-item"][data-active] input, [data-slot="questionnaire-item"][data-active] select');
    for (const control of controls ?? []) {
      if (!control.checkValidity()) { control.reportValidity(); return false; }
    }
    return true;
  }
  function change(name: keyof typeof values, value: string) {
    setValues(previous => ({ ...previous, [name]: value }));
    setState({ status: 'idle' });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !validateCurrent()) return;
    const data = new FormData(event.currentTarget);
    for (const [name, value] of Object.entries(values)) data.set(name, value);
    data.set('consent', consent ? 'yes' : '');
    startTransition(async () => {
      let result: DunReservationState;
      try { result = await submitDunReservation(data); }
      catch { result = { status: 'error', message: 'Vi fikk ikke registrert reservasjonen. Prøv igjen litt senere.' }; }
      setState(result);
      if (result.status === 'error') {
        if (result.errors) setItem(result.errors.color || result.errors.size ? 'variant' : result.errors.consent ? 'consent' : 'contact');
        emitStorefrontAction('utekos:form-error', { formId: 'product_reservation_utekos_dun', attemptId: crypto.randomUUID(), category: result.errors ? 'validation' : 'submission_failed' });
      }
    });
  }

  return <Dialog title="Reserver Utekos Dun™" onClose={onClose}>
    <div className={styles.content}>
      {state.status === 'success' ? <div role="status" tabIndex={-1} ref={successRef} className={styles.success}>
        <h3>Din Utekos er reservert.</h3>
        <p>Vi har holdt av en Utekos Dun™ til deg. Du hører fra oss med en betalingslenke i uke 43.</p>
        <button type="button" className={styles.primary} onClick={onClose}>Lukk</button>
      </div> : <>
        <p>Velg din jakke, så holder vi den av til deg. Vi sender deg en uforpliktende betalingslenke på SMS og e-post så snart den er på lager i uke 43.</p>
        <Questionnaire ref={formRef} items={items} item={item} onItemChange={next => {
          if (items.findIndex(step => step.name === next) > items.findIndex(step => step.name === item) && !validateCurrent()) return;
          setItem(next);
        }} onSubmit={submit} className={styles.form} aria-busy={pending}
          data-tracking-form="product_reservation_utekos_dun" data-tracking-form-name="Reserver Utekos Dun">
          <QuestionnaireProgress className={styles.progress} aria-label="Fremdrift" aria-valuetext={`Steg ${items.findIndex(step => step.name === item) + 1} av 3`}>Steg {items.findIndex(step => step.name === item) + 1} av 3</QuestionnaireProgress>
          <QuestionnaireItem name="variant" multiple required>
            <QuestionnaireTitle className={styles.title}>Velg variant</QuestionnaireTitle>
            <div className={styles.fields}>
              <div className={styles.field}><label htmlFor={`${id}-color`}>Farge</label>
                <QuestionnaireInput id={`${id}-color`} className={styles.input} render={<select />} value={values.color} onChange={event => change('color', event.target.value)} required disabled={pending}>
                  {dunColors.map(color => <option key={color} value={color}>{color}</option>)}
                </QuestionnaireInput>
              </div>
              <div className={styles.field}><label htmlFor={`${id}-size`}>Størrelse</label>
                <QuestionnaireInput id={`${id}-size`} className={styles.input} render={<select />} value={values.size} onChange={event => change('size', event.target.value)} required disabled={pending}>
                  {dunSizes.map(size => <option key={size} value={size}>{size}</option>)}
                </QuestionnaireInput>
              </div>
            </div>
            <QuestionnaireError>Velg farge og størrelse.</QuestionnaireError>
          </QuestionnaireItem>
          <QuestionnaireItem name="contact" multiple required>
            <QuestionnaireTitle className={styles.title}>Kontaktinformasjon</QuestionnaireTitle>
            <div className={styles.fields}>
              {fields.map(field => <label key={field.name} htmlFor={`${id}-${field.name}`}>{field.label}
                <QuestionnaireInput id={`${id}-${field.name}`} type={field.type} autoComplete={field.autoComplete} maxLength={field.maxLength}
                  className={styles.input} value={values[field.name]} onChange={event => change(field.name, event.target.value)} required minLength={1} disabled={pending}
                  pattern={field.name === 'phone' ? '\\+?[0-9 ()-]{8,40}' : field.type === 'text' ? '.*\\S.*' : undefined}
                  aria-invalid={!!state.errors?.[field.name]} aria-describedby={state.errors?.[field.name] ? `${id}-${field.name}-error` : undefined} />
                {state.errors?.[field.name] && <span id={`${id}-${field.name}-error`} className={styles.error}>{state.errors[field.name]?.join(' ')}</span>}
              </label>)}
            </div>
            <QuestionnaireError>Fyll ut kontaktinformasjonen din.</QuestionnaireError>
          </QuestionnaireItem>
          <QuestionnaireItem name="consent" multiple required>
            <QuestionnaireTitle className={styles.title}>Samtykke</QuestionnaireTitle>
            <p className={styles.summary}>Utekos Dun™ · {values.color} · {values.size}</p>
            <QuestionnaireChoices>
              <QuestionnaireChoice className={styles.consent} value="yes" checked={consent} disabled={pending} onChange={event => { setConsent(event.target.checked); setState({ status: 'idle' }); }}>{dunReservationConsent}</QuestionnaireChoice>
            </QuestionnaireChoices>
            <p className={styles.privacy}><Link href="/personvern" target="_blank" rel="noopener">Personvernerklæringen (åpnes i ny fane)</Link></p>
            <QuestionnaireError>Bekreft at vi kan holde av jakken og sende betalingslenken.</QuestionnaireError>
          </QuestionnaireItem>
          <div className={styles.honeypot} aria-hidden="true"><label>Nettside<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
          <QuestionnaireActions className={styles.actions}>
            <QuestionnairePrevious className={styles.secondary} disabled={pending}>Tilbake</QuestionnairePrevious>
            <QuestionnaireNext className={styles.primary} disabled={pending} onClick={event => { if (!validateCurrent()) event.preventDefault(); }}>Neste</QuestionnaireNext>
            <QuestionnaireSubmit className={styles.primary} disabled={pending}>{pending ? 'Reserverer …' : 'Reserver'}</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
      </>}
    </div>
  </Dialog>;
}
