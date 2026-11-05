import { Brain, ChevronDown } from 'lucide-react';
import { ARTICLE_HEADINGS, type SummaryTarget } from '@/lib/ai-summary/schema';
import { getSummarySource } from '@/lib/ai-summary/source';
import { getPreparedArticleSummary } from '@/lib/ai-summary/preparedArticles';
import { ProductAiSummary } from './ProductAiSummary';
import styles from './PageAiSummary.module.css';

async function ArticleAiSummary({ target }: { target: SummaryTarget }) {
  const source = await getSummarySource(target);
  const content = source && getPreparedArticleSummary(source);
  if (!content) throw new Error(`Prepared article summary missing or outdated: ${target.slug}`);
  return (
    <details className={styles.card} data-appearance="article" data-ai-summary={target.slug}>
      <summary className={styles.trigger}>
        <Brain size={20} aria-hidden="true" />
        <span>Oppsummer denne artikkelen for meg</span>
        <ChevronDown size={20} aria-hidden="true" />
      </summary>
      <div className={styles.content}>
        <div className={styles.article} data-article-summary-content>
          <h3>{ARTICLE_HEADINGS[0]}</h3>
          <p>{content.scope}</p>
          <h3>{ARTICLE_HEADINGS[1]}</h3>
          <p>{content.learning}</p>
          <h3>{ARTICLE_HEADINGS[2]}</h3>
          <ul>{content.points.map((point, index) => <li key={index}>
            {point.text}
            {point.details.length > 0 && <ul>{point.details.map((detail, detailIndex) => <li key={detailIndex}>{detail}</li>)}</ul>}
          </li>)}</ul>
        </div>
        <p className={styles.note}>AI-generert. Les hele artikkelen for alle nyanser.</p>
      </div>
    </details>
  );
}

export function PageAiSummary({ target }: { target: SummaryTarget }) {
  if (process.env.NEXT_PUBLIC_AI_SUMMARY_ENABLED !== 'true') return null;
  return target.kind === 'article' ? <ArticleAiSummary target={target} /> : <ProductAiSummary target={target} />;
}
