'use client';

import dynamic from 'next/dynamic';
import { Brain, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { SummaryTarget } from '@/lib/ai-summary/schema';
import styles from './PageAiSummary.module.css';

// Load the AI client and validation library only after activation.
const SummaryContent = dynamic(() => import('./PageAiSummaryContent').then(module => module.PageAiSummaryContent), {
  loading: () => <p className={`${styles.content} shimmer`} role="status">Åpner oppsummeringen …</p>,
});

export function PageAiSummary({ target }: { target: SummaryTarget }) {
  const [active, setActive] = useState(false);
  if (process.env.NEXT_PUBLIC_AI_SUMMARY_ENABLED !== 'true') return null;
  return (
    <section className={styles.card} data-appearance={target.kind} data-ai-summary={target.slug}>
      {active ? <SummaryContent target={target} /> : (
        <button type="button" className={styles.trigger} aria-expanded={false} onClick={() => setActive(true)}>
          <Brain size={20} className="text-primary" aria-hidden="true" />
          <span>Det viktigste, kort fortalt <span className={styles.label}>AI-oppsummering</span></span>
          <ChevronDown size={20} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
