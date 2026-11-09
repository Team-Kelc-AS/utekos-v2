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
import { ArticleReadingProgress } from "./ArticleReadingProgress";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import articleStyles from "@/app/(site)/(blog)/uteguiden/knowledgeArticle.module.css";

export function KnowledgeArticleScaffold({
  article,
  hero,
  children,
  header,
  footer,
  className,
  tocLayout = "sidebar",
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
  const hasSidebar = tocLayout === "sidebar" && article.toc.length > 0;
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
          <KnowledgeArticleReadingTools article={article} />
        ) : <>
          <ArticleReadingProgress />
          {article.toc.length > 0 && !header ? <KnowledgeToc article={article} /> : null}
        </>}
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

  return <KnowledgeArticleNavigation article={article}>{content}</KnowledgeArticleNavigation>;
}

type ArticleNavigationProps = {
  article: Pick<KnowledgeArticle, "slug" | "toc">;
};

/** Custom MDX articles share the same navigation without rewriting their content. */
export function KnowledgeArticleNavigation({ article, children }: ArticleNavigationProps & { children: ReactNode }) {
  return (
    <div className={articleStyles.withToc} data-knowledge-layout>
      {children}
      <aside className={cn(articleStyles.tocRail, "hidden xl:block")}>
        <div className={articleStyles.tocSticky}>
          <DocsTableOfContents article={article} variant="list" />
        </div>
      </aside>
    </div>
  );
}

export function KnowledgeArticleReadingTools({ article }: ArticleNavigationProps) {
  return <>
    <ArticleReadingProgress />
    <div className={cn(articleStyles.mobileToc, "xl:hidden")}>
      <DocsTableOfContents article={article} variant="accordion" />
    </div>
  </>;
}
