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
import { DocsTableOfContents } from "./DocsTableOfContents";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import articleStyles from "@/app/(blog)/uteguiden/knowledgeArticle.module.css";

export function KnowledgeArticleScaffold({
  article,
  hero,
  children,
  header,
  footer,
  className,
  tocLayout = "inline",
}: {
  article: KnowledgeArticle;
  hero?: ReactNode;
  children: ReactNode;
  /** Preserve an existing editorial introduction without rewriting its copy. */
  header?: ReactNode;
  /** Override closing content when migrating an article verbatim. */
  footer?: ReactNode;
  className?: string;
  tocLayout?: "inline" | "sidebar";
}) {
  const hasSidebar = tocLayout === "sidebar" && article.toc.length > 0 && !header;
  const content = (
    <article
      id="top"
      className={cn(articleStyles.article, className)}
    >
      {header ?? <KnowledgeArticleIntro article={article} />}
      {hero ?? <KnowledgeRegisteredImage article={article} preload />}
      <div className={articleStyles.body} data-article-body>
        {article.learnings.length > 0 && !header ? (
          <KnowledgeLearnings article={article} />
        ) : null}
        {hasSidebar ? (
          <div className={cn(articleStyles.mobileToc, "xl:hidden")}>
            <DocsTableOfContents article={article} variant="accordion" />
          </div>
        ) : article.toc.length > 0 && !header ? <KnowledgeToc article={article} /> : null}
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

  if (!hasSidebar) return content;

  return (
    <div className={articleStyles.withToc} data-knowledge-layout>
      {content}
      <aside className={cn(articleStyles.tocRail, "hidden xl:block")}>
        <div className={articleStyles.tocSticky}>
          <DocsTableOfContents article={article} variant="list" />
        </div>
      </aside>
    </div>
  );
}
