'use client';

import { useObject } from '@ai-sdk/react';
import { ChevronDown, Brain } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { pageSummarySchema, type SummaryTarget } from '@/lib/ai-summary/schema';
import styles from './PageAiSummary.module.css';

export function PageAiSummaryContent({ target }: { target: SummaryTarget }) {
  const [open, setOpen] = useState(true);
  const [started, setStarted] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const regionId = useId();
  const { object, submit, isLoading, error, stop, clear } = useObject({
    api: '/api/ai-summary',
    schema: pageSummarySchema,
    onFinish: ({ object, error }) => setInvalid(Boolean(error) || !object),
    onError: () => setInvalid(true),
  });
  const initialSubmit = useRef(submit);
  const initialTarget = useRef(target);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    trigger.current?.focus({ preventScroll: true });
    initialSubmit.current(initialTarget.current);
    return () => stop();
  }, [stop]);
  const failed = invalid || Boolean(error);

  function activate() {
    setInvalid(false);
    setStarted(true);
    setOpen(true);
    submit(target);
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => started ? setOpen(!open) : activate()}
      >
        <Brain size={20} className="text-primary" aria-hidden="true" />
        <span>Det viktigste, kort fortalt <span className={styles.label}>AI-oppsummering</span></span>
        <ChevronDown size={20} aria-hidden="true" className={open ? styles.chevronOpen : undefined} />
      </button>
      <div id={regionId} hidden={!open} className={styles.content}>
        <p className={`${styles.status}${isLoading ? " shimmer" : ""}`} role="status">
          {isLoading ? 'Lager en oppsummering av sidens innhold …' : failed ? 'Oppsummeringen kunne ikke lastes.' : 'AI-oppsummering basert på innholdet på denne siden.'}
        </p>
        {!failed && object ? (
          <div aria-busy={isLoading}>
            {object.summary && <p className={styles.summary}>{object.summary}</p>}
            {!!object.keyPoints?.length && <ul className={styles.points}>
              {object.keyPoints.map((point, index) => point && <li key={index}>{point}</li>)}
            </ul>}
            {!!object.limitations?.length && <div className={styles.limitations}>
              <p className={styles.subheading}>Verdt å merke seg</p>
              <ul className={styles.points}>
                {object.limitations.map((point, index) => point && <li key={index}>{point}</li>)}
              </ul>
            </div>}
          </div>
        ) : null}
        {failed && <>
          <p>Du finner hele {target.kind === 'product' ? 'produktbeskrivelsen og detaljene' : 'artikkelen'} på siden. Prøv gjerne igjen om litt.</p>
          <button type="button" className={styles.action} onClick={activate}>Prøv igjen</button>
        </>}
        {isLoading && <button type="button" className={styles.action} onClick={() => {
          clear(); setStarted(false); setOpen(false); setInvalid(false);
        }}>Avbryt</button>}
        {!isLoading && !failed && object && <p className={styles.note}>
          AI kan gjøre feil og utelate nyanser. Les {target.kind === 'product' ? 'produktdetaljene' : 'hele artikkelen'} for sammenheng og forbehold.
        </p>}
      </div>
    </>
  );
}
