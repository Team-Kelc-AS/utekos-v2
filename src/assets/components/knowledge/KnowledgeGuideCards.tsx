import "server-only";

import type { ReactNode } from "react";
import { ImageCardSection } from "@/components/ImageCardSection";
import type { KnowledgeArticle } from "@/lib/knowledge/knowledgeArticles";

export function KnowledgeGuideCards({
  articles,
  id = "related-guides",
  children,
}: {
  articles: readonly KnowledgeArticle[];
  id?: string;
  children?: ReactNode;
}) {
  return (
    <ImageCardSection
      id={id}
      title="Råd fra Uteguiden"
      cards={articles.map((article) => ({
        href: article.path,
        title: article.title,
        description: article.description,
        image: article.cardImage,
        badge: "Uteguiden",
        action: "Les artikkelen",
      }))}
    >
      {children}
    </ImageCardSection>
  );
}
