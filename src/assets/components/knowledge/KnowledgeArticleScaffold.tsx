import "server-only";

import { ArticleRelatedContent } from "./RelatedContent";
import { BackToTop } from "./BackToTop";
import type { KnowledgeArticle } from "@/lib/knowledge/knowledgeArticles";
import { KnowledgeArticleBreadcrumbs } from "./KnowledgeArticleBreadcrumbs";
import { KnowledgeArticleIntro } from "./KnowledgeArticleIntro";
import { KnowledgeLearnings } from "./KnowledgeLearnings";
import { KnowledgeSources } from "./KnowledgeSources";
import { KnowledgeToc } from "./KnowledgeToc";
import type { ReactNode } from "react";
import articleStyles from "@/app/(blog)/uteguiden/knowledgeArticle.module.css";

export function KnowledgeArticleScaffold({
  article,
  hero,
  heroPlacement = "before-title",
  children,
}: {
  article: KnowledgeArticle;
  hero?: ReactNode;
  heroPlacement?: "before-title" | "after-title";
  children: ReactNode;
}) {
  return (
    <article id="top" className={articleStyles.article}>
      <KnowledgeArticleBreadcrumbs article={article} />
      {heroPlacement === "before-title" ? hero : null}
      <KnowledgeArticleIntro
        article={article}
        afterTitle={heroPlacement === "after-title" ? hero : undefined}
      />
      <KnowledgeLearnings article={article} />
      <KnowledgeToc article={article} />
      <div className={articleStyles.body}>{children}</div>
      <ArticleRelatedContent article={article} />
      <BackToTop />
      <KnowledgeSources article={article} />
    </article>
  );
}
