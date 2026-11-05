'use client';

import { Brain, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ArticleSummary } from '@/lib/ai-summary/schema';
import { ARTICLE_PRESENTATION_COMPLETE_MS, ARTICLE_STATUS_MESSAGES, ARTICLE_STATUS_MS, ARTICLE_STATUS_STEP_MS, ARTICLE_TEXT_COMPLETE_MS, articlePresentationBlocks, articleRevealTimeline, articleVisibleCharacters } from '@/lib/ai-summary/articlePresentation';

// Browser module memory survives client navigation, but resets on a full reload.
const presentedArticles = new Set<string>();

export function ArticleSummaryDisclosure({ slug, content }: { slug: string; content: ArticleSummary }) {
  const details = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const [run, setRun] = useState<{ startedAt: number; timeline: ReturnType<typeof articleRevealTimeline> } | null>(null);
  const [elapsed, setElapsed] = useState(ARTICLE_PRESENTATION_COMPLETE_MS);
  const blocks = articlePresentationBlocks(content);
  const fullText = blocks.map(block => block.text).join(' ');
  const presentationKey = `${slug}:${fullText}`;
  const headingClassName = slug === 'sherpacore'
    ? 'mx-0! mt-8! mb-3! text-[21px]! font-extrabold! leading-[1.3]! first:mt-0! min-[896px]:mt-9! min-[896px]:mb-4! min-[896px]:text-[23px]!'
    : 'mx-0! mt-5! mb-1.5! text-base! font-extrabold! leading-6! first:mt-0!';
  const paragraphClassName = `mx-0! mt-0! max-w-[55ch] text-base! leading-[1.65]! ${slug === 'hydroguard' ? 'mb-0!' : 'mb-3.5!'}`;
  const noteClassName = `mx-0! max-w-[55ch] text-[.8125rem]! leading-[1.65]! last:mb-0! ${slug === 'hydroguard' ? 'mt-6! mb-0!' : slug === 'sherpacore' ? 'mt-6! mb-3.5!' : 'mt-0! mb-3.5!'}`;

  useEffect(() => {
    if (!run) return;
    let frame: number;
    const tick = () => {
      const next = Math.min(ARTICLE_PRESENTATION_COMPLETE_MS, performance.now() - run.startedAt);
      setElapsed(next);
      if (next < ARTICLE_PRESENTATION_COMPLETE_MS) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run]);

  const preparing = elapsed < ARTICLE_STATUS_MS;
  const typing = elapsed >= ARTICLE_STATUS_MS && elapsed < ARTICLE_TEXT_COMPLETE_MS;
  const animating = elapsed < ARTICLE_PRESENTATION_COMPLETE_MS;
  const visible = run ? articleVisibleCharacters(elapsed, run.timeline) : fullText.length;
  const cursorBlock = blocks.find(block => visible <= block.end)?.id;
  const phase = preparing ? 'status' : typing ? 'typing' : animating ? 'settling' : 'complete';

  function blockVisible(id: string) {
    const block = blocks.find(block => block.id === id)!;
    return visible > block.start || (!preparing && animating && cursorBlock === id);
  }

  function text(id: string) {
    const block = blocks.find(block => block.id === id)!;
    return <>{block.text.slice(0, Math.max(0, visible - block.start))}
      {!preparing && animating && cursorBlock === id && <span className="ml-[.12em] inline-block h-[1em] w-[.08em] align-[-.1em] bg-current animate-summary-cursor data-settling:animate-summary-cursor-finish motion-reduce:animate-none" data-summary-cursor data-settling={!typing || undefined} aria-hidden="true" />}
    </>;
  }

  return (
    <details ref={details} open={open} className="group my-6 w-full min-w-0 rounded-[.75rem] border border-(--summary-border) bg-(--summary-surface) font-medium text-(--summary-ink) wrap-anywhere [--summary-surface:var(--knowledge-surface,#f0eee9)] [--summary-ink:var(--knowledge-ink,#010b0a)] [--summary-border:var(--knowledge-border-strong,color-mix(in_srgb,#001a18_35%,transparent))]" data-appearance="article" data-ai-summary={slug} data-presentation-phase={phase}>
      <summary className="flex min-h-18 w-full cursor-pointer list-none items-center gap-3.5 rounded-[inherit] p-4 text-left text-inherit [font:inherit] font-extrabold! leading-[1.4]! hover:bg-[color-mix(in_srgb,var(--summary-ink)_5%,transparent)] focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4 sm:px-5 [&::-webkit-details-marker]:hidden" onClick={event => {
        event.preventDefault();
        if (details.current?.open) {
          setOpen(false); setRun(null); setElapsed(ARTICLE_PRESENTATION_COMPLETE_MS);
          return;
        }
        setOpen(true);
        if (presentedArticles.has(presentationKey) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          presentedArticles.add(presentationKey);
          setRun(null); setElapsed(ARTICLE_PRESENTATION_COMPLETE_MS);
          return;
        }
        presentedArticles.add(presentationKey);
        setElapsed(0);
        setRun({ startedAt: event.timeStamp, timeline: articleRevealTimeline(fullText) });
      }}>
        <Brain size={20} className="shrink-0" aria-hidden="true" />
        <span>Oppsummer denne artikkelen for meg</span>
        <ChevronDown size={20} className="ml-auto shrink-0 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-(--summary-border) p-4 sm:p-5">
        {animating && <p className={noteClassName}>Visningsanimasjon – teksten er generert på forhånd.</p>}
        <div role="status" aria-live="polite" aria-atomic="true" className={preparing ? 'min-h-10 font-medium leading-[1.65]' : 'sr-only'}>
          {preparing ? ARTICLE_STATUS_MESSAGES[Math.min(2, Math.floor(elapsed / ARTICLE_STATUS_STEP_MS))] : typing ? 'Viser oppsummeringen…' : 'Oppsummeringen er klar.'}
        </div>
        <div className="max-w-[65ch] [&[hidden]]:hidden! [&_[hidden]]:hidden!" data-article-summary-content hidden={preparing} aria-busy={typing}>
          <h3 className={headingClassName} hidden={!blockVisible('scope-heading')}>{text('scope-heading')}</h3>
          <p className={paragraphClassName} hidden={!blockVisible('scope')}>{text('scope')}</p>
          <h3 className={headingClassName} hidden={!blockVisible('learning-heading')}>{text('learning-heading')}</h3>
          <p className={paragraphClassName} hidden={!blockVisible('learning')}>{text('learning')}</p>
          <h3 className={headingClassName} hidden={!blockVisible('points-heading')}>{text('points-heading')}</h3>
          <ul className="m-0! mb-4! list-disc! pl-5! text-base! leading-[1.65]!" hidden={!blockVisible('point-0')}>{content.points.map((point, index) => <li className="my-1.5! pl-0.5!" key={index} hidden={!blockVisible(`point-${index}`)}>
            {text(`point-${index}`)}
            {point.details.length > 0 && <ul className="mx-0! mt-1! mb-2! list-[circle]! pl-5! text-base! leading-[1.65]!" hidden={!blockVisible(`detail-${index}-0`)}>{point.details.map((_, detailIndex) => <li className="my-1.5! pl-0.5!" key={detailIndex} hidden={!blockVisible(`detail-${index}-${detailIndex}`)}>{text(`detail-${index}-${detailIndex}`)}</li>)}</ul>}
          </li>)}</ul>
        </div>
        {!animating && <p className={noteClassName}>AI-generert. Les hele artikkelen for alle nyanser.</p>}
      </div>
    </details>
  );
}
