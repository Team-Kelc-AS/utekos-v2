import type { ReactNode } from "react";
import { KnowledgeJsonLd } from "@/components/knowledge/KnowledgeJsonLd";
import { buildKnowledgeMetadata } from "@/lib/knowledge/buildKnowledgeMetadata";
import { knowledgeArticles } from "@/lib/knowledge/knowledgeArticles";

export const metadata = buildKnowledgeMetadata(knowledgeArticles.winterStorage);

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return <><KnowledgeJsonLd article={knowledgeArticles.winterStorage} />{children}</>;
}
