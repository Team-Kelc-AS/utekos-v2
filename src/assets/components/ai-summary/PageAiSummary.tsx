'use client';

import dynamic from 'next/dynamic';
import { Brain, ChevronDown } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import type { SummaryTarget } from '@/lib/ai-summary/schema';
import styles from './PageAiSummary.module.css';

const subscribe = () => () => {};
const browserSnapshot = () => true;
const serverSnapshot = () => false;

// Load the AI client and validation library only after activation.
const SummaryContent = dynamic(() => import('./PageAiSummaryContent').then(module => module.PageAiSummaryContent), {
  loading: () => <div className={styles.trigger} aria-busy="true"><Brain size={20} aria-hidden="true" /><span>Kortversjonen</span><span className={styles.loader} role="status" aria-label="Laster" /></div>,
});
const ArticleSummaryContent = dynamic(() => import('./PageAiSummaryContent').then(module => module.PageAiSummaryContent), {
  loading: () => <div className={styles.trigger} aria-busy="true"><Brain size={20} aria-hidden="true" /><span>Oppsummer denne artikkelen for meg</span><span className={styles.loader} role="status" aria-label="Laster" /></div>,
});

export function PageAiSummary({ target }: { target: SummaryTarget }) {
  const [active, setActive] = useState(false);
  const hydrated = useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
  const Content = target.kind === 'article' ? ArticleSummaryContent : SummaryContent;
  if (process.env.NEXT_PUBLIC_AI_SUMMARY_ENABLED !== 'true') return null;
  return (
    <section className={styles.card} data-appearance={target.kind} data-ai-summary={target.slug}>
      {active ? <Content target={target} /> : (
        <button type="button" className={styles.trigger} disabled={!hydrated} aria-expanded={false} onClick={() => setActive(true)}>
          <Brain size={20} aria-hidden="true" />
          <span>{target.kind === 'article' ? 'Oppsummer denne artikkelen for meg' : 'Kortversjonen'}</span>
          <ChevronDown size={20} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
