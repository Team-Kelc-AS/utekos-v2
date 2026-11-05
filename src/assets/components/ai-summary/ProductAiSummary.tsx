'use client';

import dynamic from 'next/dynamic';
import { Brain, ChevronDown } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import type { SummaryTarget } from '@/lib/ai-summary/schema';

const subscribe = () => () => {};
const browserSnapshot = () => true;
const serverSnapshot = () => false;

// Load the AI client and validation library only after activation.
const SummaryContent = dynamic(() => import('./PageAiSummaryContent').then(module => module.PageAiSummaryContent), {
  loading: () => <div className="flex min-h-18 w-full cursor-pointer items-center gap-3.5 rounded-[inherit] p-4 text-left text-inherit [font:inherit] font-extrabold! leading-[1.4]! hover:bg-[color-mix(in_srgb,var(--summary-ink)_5%,transparent)] focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4 sm:px-5" aria-busy="true"><Brain size={20} className="shrink-0" aria-hidden="true" /><span>Kortversjonen</span><span className="m-2 inline-block size-4 rounded-full border-2 border-(--summary-border) border-t-current animate-spin [animation-duration:800ms] motion-reduce:animate-none" role="status" aria-label="Laster" /></div>,
});

export function ProductAiSummary({ target }: { target: SummaryTarget }) {
  const [active, setActive] = useState(false);
  const hydrated = useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
  if (process.env.NEXT_PUBLIC_AI_SUMMARY_ENABLED !== 'true') return null;
  return (
    <section className="my-6 w-full min-w-0 rounded-[.75rem] border border-(--summary-border) bg-(--summary-surface) font-medium text-(--summary-ink) wrap-anywhere [--summary-surface:var(--product-page-surface,var(--night))] [--summary-ink:var(--primary-foreground)] [--summary-border:color-mix(in_srgb,var(--summary-ink)_24%,transparent)]" data-appearance={target.kind} data-ai-summary={target.slug}>
      {active ? <SummaryContent target={target} /> : (
        <button type="button" className="flex min-h-18 w-full cursor-pointer items-center gap-3.5 rounded-[inherit] p-4 text-left text-inherit [font:inherit] font-extrabold! leading-[1.4]! hover:bg-[color-mix(in_srgb,var(--summary-ink)_5%,transparent)] focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4 sm:px-5" disabled={!hydrated} aria-expanded={false} onClick={() => setActive(true)}>
          <Brain size={20} className="shrink-0" aria-hidden="true" />
          <span>Kortversjonen</span>
          <ChevronDown size={20} className="ml-auto shrink-0" aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
