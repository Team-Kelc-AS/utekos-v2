'use client';

import { Brain, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ArticleSummary } from '@/lib/ai-summary/schema';
import { ARTICLE_PRESENTATION_COMPLETE_MS, ARTICLE_STATUS_MESSAGES, ARTICLE_STATUS_MS, ARTICLE_TEXT_COMPLETE_MS, articlePresentationBlocks, articleRevealTimeline, articleVisibleCharacters } from '@/lib/ai-summary/articlePresentation';
import styles from './PageAiSummary.module.css';

export function ArticleSummaryDisclosure({ slug, content }: { slug: string; content: ArticleSummary }) {
  const details = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const [run, setRun] = useState<{ startedAt: number; timeline: ReturnType<typeof articleRevealTimeline> } | null>(null);
  const [elapsed, setElapsed] = useState(ARTICLE_PRESENTATION_COMPLETE_MS);
  const blocks = articlePresentationBlocks(content);
  const fullText = blocks.map(block => block.text).join(' ');

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
      {!preparing && animating && cursorBlock === id && <span className={styles.cursor} data-settling={!typing || undefined} aria-hidden="true" />}
    </>;
  }

  return (
    <details ref={details} open={open} className={styles.card} data-appearance="article" data-ai-summary={slug} data-presentation-phase={phase}>
      <summary className={styles.trigger} onClick={event => {
        event.preventDefault();
        if (details.current?.open) {
          setOpen(false); setRun(null); setElapsed(ARTICLE_PRESENTATION_COMPLETE_MS);
          return;
        }
        setOpen(true);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setRun(null); setElapsed(ARTICLE_PRESENTATION_COMPLETE_MS);
          return;
        }
        setElapsed(0);
        setRun({ startedAt: event.timeStamp, timeline: articleRevealTimeline(fullText) });
      }}>
        <Brain size={20} aria-hidden="true" />
        <span>Oppsummer denne artikkelen for meg</span>
        <ChevronDown size={20} aria-hidden="true" />
      </summary>
      <div className={styles.content}>
        {animating && <p className={styles.note}>Visningsanimasjon – teksten er generert på forhånd.</p>}
        <div role="status" aria-live="polite" aria-atomic="true" className={preparing ? styles.presentationStatus : styles.srOnly}>
          {preparing ? ARTICLE_STATUS_MESSAGES[Math.min(2, Math.floor(elapsed / 400))] : typing ? 'Viser oppsummeringen…' : 'Oppsummeringen er klar.'}
        </div>
        <div className={styles.article} data-article-summary-content hidden={preparing} aria-busy={typing}>
          <h3 hidden={!blockVisible('scope-heading')}>{text('scope-heading')}</h3>
          <p hidden={!blockVisible('scope')}>{text('scope')}</p>
          <h3 hidden={!blockVisible('learning-heading')}>{text('learning-heading')}</h3>
          <p hidden={!blockVisible('learning')}>{text('learning')}</p>
          <h3 hidden={!blockVisible('points-heading')}>{text('points-heading')}</h3>
          <ul hidden={!blockVisible('point-0')}>{content.points.map((point, index) => <li key={index} hidden={!blockVisible(`point-${index}`)}>
            {text(`point-${index}`)}
            {point.details.length > 0 && <ul hidden={!blockVisible(`detail-${index}-0`)}>{point.details.map((_, detailIndex) => <li key={detailIndex} hidden={!blockVisible(`detail-${index}-${detailIndex}`)}>{text(`detail-${index}-${detailIndex}`)}</li>)}</ul>}
          </li>)}</ul>
        </div>
        {!animating && <p className={styles.note}>AI-generert. Les hele artikkelen for alle nyanser.</p>}
      </div>
    </details>
  );
}
