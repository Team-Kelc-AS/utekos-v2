'use client';

import { useObject } from '@ai-sdk/react';
import { Brain, ChevronDown, Star } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { ARTICLE_HEADINGS, articleSummaryIssues, summaryResponseSchema, type SummaryTarget } from '@/lib/ai-summary/schema';
import styles from './PageAiSummary.module.css';

export function PageAiSummaryContent({ target }: { target: SummaryTarget }) {
  const [open, setOpen] = useState(true);
  const [started, setStarted] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const regionId = useId();
  const { object, submit, isLoading, error, stop, clear } = useObject({
    api: '/api/ai-summary',
    schema: summaryResponseSchema,
    onFinish: ({ object, error }) => setInvalid(Boolean(error) || !object || ('scope' in object.content && articleSummaryIssues(object.content).length > 0)),
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
  const article = object?.content && 'scope' in object.content ? object.content : undefined;
  const product = object?.content && 'summary' in object.content ? object.content : undefined;

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
        <Brain size={20} aria-hidden="true" />
        <span>{target.kind === 'article' ? 'Oppsummer denne artikkelen for meg' : 'Kortversjonen'}</span>
        <ChevronDown size={20} aria-hidden="true" className={open ? styles.chevronOpen : undefined} />
      </button>
      <div id={regionId} hidden={!open} className={styles.content} aria-busy={isLoading}>
        {isLoading && !product?.summary && !article?.scope && <span className={styles.loader} role="status" aria-label="Laster" />}
        {!failed && object ? (
          <div>
            {target.kind === 'article' && article && <div className={styles.article} data-article-summary-content>
              <h3>{ARTICLE_HEADINGS[0]}</h3>
              <p>{article.scope}</p>
              <h3>{ARTICLE_HEADINGS[1]}</h3>
              <p>{article.learning}</p>
              <h3>{ARTICLE_HEADINGS[2]}</h3>
              <ul>{article.points?.map((point, index) => point && <li key={index}>
                {point.text}
                {Boolean(point.details?.length) && <ul>{point.details?.map((detail, detailIndex) => <li key={detailIndex}>{detail}</li>)}</ul>}
              </li>)}</ul>
            </div>}
            {product?.summary && <p className={styles.summary}>{product.summary}</p>}
            {target.kind === 'product' && object.reviews?.count !== undefined && object.reviews.average !== undefined && (
              <p className={styles.rating}>
                {object.reviews.count > 0 ? <><Star size={16} aria-hidden="true" />{object.reviews.average.toLocaleString('nb-NO', { maximumFractionDigits: 2 })}/5 · {object.reviews.count} {object.reviews.count === 1 ? 'omtale' : 'omtaler'} på Judge.me</> : 'Ingen produktomtaler ennå.'}
              </p>
            )}
            {product?.reviewSummary && <p>{product.reviewSummary}</p>}
            {object.reviews?.includedCount !== undefined && object.reviews.count !== undefined && object.reviews.includedCount < object.reviews.count && <p className={styles.note}>Omtaleteksten bygger på {object.reviews.includedCount} av {object.reviews.count} omtaler.</p>}
            {!isLoading && target.kind === 'product' && object.reviews === null && <p className={styles.note}>Kundeomtaler er midlertidig utilgjengelige.</p>}
          </div>
        ) : null}
        {failed && <>
          <p role="status">Oppsummeringen kunne ikke lastes.</p>
          <button type="button" className={styles.action} onClick={activate}>Prøv igjen</button>
        </>}
        {isLoading && <button type="button" className={styles.action} onClick={() => {
          clear(); setStarted(false); setOpen(false); setInvalid(false);
        }}>Avbryt</button>}
        {!isLoading && !failed && object && <p className={styles.note}>
          AI-generert. Les {target.kind === 'product' ? 'produktdetaljene og omtalene' : 'hele artikkelen'} for alle nyanser.
        </p>}
      </div>
    </>
  );
}
