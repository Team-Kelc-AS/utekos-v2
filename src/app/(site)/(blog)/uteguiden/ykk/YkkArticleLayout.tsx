import type { ReactNode } from "react";
import { KnowledgeArticleScaffold } from "@/components/knowledge/KnowledgeArticleScaffold";
import { knowledgeArticles } from "@/lib/knowledge/knowledgeArticles";

export function YkkArticleLayout({ children }: { children: ReactNode }) {
  return (
    <KnowledgeArticleScaffold article={knowledgeArticles.ykk}>
      {children}
    </KnowledgeArticleScaffold>
  );
}
