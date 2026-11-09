import type { ReactNode } from "react";
import { KnowledgeArticleScaffold } from "@/components/knowledge/KnowledgeArticleScaffold";
import { knowledgeArticles } from "@/lib/knowledge/knowledgeArticles";

export function TerraceArticleLayout({ children }: { children: ReactNode }) {
  return (
    <KnowledgeArticleScaffold article={knowledgeArticles.terrace}>
      {children}
    </KnowledgeArticleScaffold>
  );
}
