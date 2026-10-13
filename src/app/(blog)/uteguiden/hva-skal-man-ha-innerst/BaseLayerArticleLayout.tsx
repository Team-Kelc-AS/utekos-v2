import type { ReactNode } from "react";
import { KnowledgeArticleScaffold } from "@/components/knowledge/KnowledgeArticleScaffold";
import { knowledgeArticles } from "@/lib/knowledge/knowledgeArticles";
import { BaseLayerHero } from "./BaseLayerHero";

export function BaseLayerArticleLayout({ children }: { children: ReactNode }) {
  return (
    <KnowledgeArticleScaffold
      article={knowledgeArticles.baseLayer}
      hero={<BaseLayerHero />}
    >
      {children}
    </KnowledgeArticleScaffold>
  );
}
