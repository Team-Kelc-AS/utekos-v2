import "server-only";
import { PageAiSummary } from "@/components/ai-summary/PageAiSummary";

import { MostReadArticles } from "./MostReadArticles";
import { BackToTop } from "./BackToTop";
import type { KnowledgeArticle } from "@/lib/knowledge/knowledgeArticles";
import { KnowledgeRegisteredImage } from "./KnowledgeRegisteredImage";
import { KnowledgeArticleIntro } from "./KnowledgeArticleIntro";
import { KnowledgeLearnings } from "./KnowledgeLearnings";
import { KnowledgeSources } from "./KnowledgeSources";
import { KnowledgeToc } from "./KnowledgeToc";
import type { ReactNode } from "react";
import articleStyles from "@/app/(blog)/uteguiden/knowledgeArticle.module.css";

export function KnowledgeArticleScaffold({
  article,
  hero,
  children,
  header,
  footer,
  className,
}: {
  article: KnowledgeArticle;
  hero?: ReactNode;
  children: ReactNode;
  /** Preserve an existing editorial introduction without rewriting its copy. */
  header?: ReactNode;
  /** Override closing content when migrating an article verbatim. */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article
      id="top"
      className={[articleStyles.article, className].filter(Boolean).join(" ")}
    >
      {header ?? <KnowledgeArticleIntro article={article} />}
      {hero ?? <KnowledgeRegisteredImage article={article} preload />}
      <div className={articleStyles.body} data-article-body>
        {article.learnings.length > 0 && !header ? (
          <KnowledgeLearnings article={article} />
        ) : null}
        {article.toc.length > 0 && !header ? <KnowledgeToc article={article} /> : null}
        <PageAiSummary
          key={article.slug}
          target={{ kind: "article", slug: article.slug }}
        />
        {children}
      </div>
      {footer ?? (
        <>
          <BackToTop />
          <KnowledgeSources article={article} />
        </>
      )}
      <MostReadArticles currentSlug={article.slug} />
    </article>
  );
}
