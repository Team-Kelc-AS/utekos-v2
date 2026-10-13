import type { ReactNode } from "react";
import { KnowledgeArticleScaffold } from "@/components/knowledge/KnowledgeArticleScaffold";
import { knowledgeArticles } from "@/lib/knowledge/knowledgeArticles";
import { KeepWarmHero } from "./KeepWarmHero";

export function KeepWarmArticleLayout({ children }: { children: ReactNode }) {
  return (
    <KnowledgeArticleScaffold
      article={knowledgeArticles.keepWarm}
      hero={<KeepWarmHero />}
      heroPlacement="after-title"
    >
      {children}
    </KnowledgeArticleScaffold>
  );
}
