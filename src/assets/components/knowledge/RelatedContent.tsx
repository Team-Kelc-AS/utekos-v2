import "server-only";

import Link from "next/link";
import type { ListingKey } from "@/lib/catalog/categories";
import {
  knowledgeArticles,
} from "@/lib/knowledge/knowledgeArticles";
import { KnowledgeGuideCards } from "./KnowledgeGuideCards";

type ArticleKey = keyof typeof knowledgeArticles;

const categoryGuides: Record<ListingKey, readonly ArticleKey[]> = {
  all: ["keepWarm", "baseLayer", "cloudweave"],
  varmeplagg: ["keepWarm", "baseLayer", "cloudweave"],
  tilbehor: ["keepWarm", "ykk"],
  "camping-og-bobil": ["keepWarm", "baseLayer"],
  hytte: ["keepWarm", "cold"],
  terrasse: ["terrace", "keepWarm"],
  glamping: ["keepWarm", "baseLayer"],
};

export function CategoryRelatedGuides({
  categoryKey,
}: {
  categoryKey: ListingKey;
}) {
  return (
    <KnowledgeGuideCards
      articles={categoryGuides[categoryKey].map(
        (key) => knowledgeArticles[key],
      )}
    >
      <Link
        href="/uteguiden"
        prefetch={false}
        className="mt-4 inline-flex min-h-11 items-center underline underline-offset-4"
      >
        Se hele Uteguiden
      </Link>
    </KnowledgeGuideCards>
  );
}

export function ProductMaterialGuide({ handle }: { handle: string }) {
  // CloudWeave belongs to TechDown; do not transfer its material claims to other products.
  const article =
    handle === "utekos-techdown" ? knowledgeArticles.cloudweave : null;
  if (!article) return null;
  return (
    <p>
      <Link
        href={article.path}
        prefetch={false}
        className="underline underline-offset-4"
      >
        Les om CloudWeave™, dun og isolasjon i Uteguiden
      </Link>
    </p>
  );
}
