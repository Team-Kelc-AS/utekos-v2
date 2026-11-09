import "server-only";

import type { Graph } from "schema-dts";
import {
  buildKnowledgeJsonLd,
  serializeKnowledgeJsonLd,
} from "@/lib/knowledge/buildKnowledgeJsonLd";
import { knowledgeArticles } from "@/lib/knowledge/knowledgeArticles";

export function ChristmasArticleJsonLd() {
  const article = knowledgeArticles.christmasGift;
  const articleGraph = buildKnowledgeJsonLd(article);
  const graph = {
    ...articleGraph,
    "@graph": articleGraph["@graph"].map((node) =>
      typeof node === "object" &&
      node !== null &&
      "@type" in node &&
      node["@type"] === "Article"
        ? { ...node, "@type": "BlogPosting" }
        : node,
    ),
  } satisfies Graph;

  return (
    <script
      id={`knowledge-${article.slug}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeKnowledgeJsonLd(graph) }}
    />
  );
}
