import "server-only";

import Link from "next/link";
import type { ListingKey } from "@/lib/catalog/categories";
import {
  knowledgeArticles,
  type KnowledgeArticle,
} from "@/lib/knowledge/knowledgeArticles";
import { KnowledgeGuideCards } from "./KnowledgeGuideCards";
import styles from "./knowledgeChrome.module.css";

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

const relatedArticles: Record<string, readonly ArticleKey[]> = {
  sherpacore: ["hydroGuard", "baseLayer", "keepWarm", "cold", "cloudweave"],
  "hvordan-forlenge-terassesesongen": ["keepWarm", "baseLayer"],
  cloudweave: ["baseLayer", "keepWarm"],
  "hva-skal-man-ha-innerst": ["keepWarm", "cloudweave"],
  "hvordan-holde-varmen-ute": ["baseLayer", "cold"],
  "hvorfor-blir-man-kald": ["keepWarm", "baseLayer"],
  ykk: ["cloudweave", "keepWarm"],
};

export function ArticleRelatedContent({
  article,
}: {
  article: KnowledgeArticle;
}) {
  return (
    <section aria-labelledby="les-videre" className={styles.related}>
      <h2 id="les-videre">Mer fra Uteguiden</h2>
      <ul>
        {(relatedArticles[article.slug] ?? []).map((key) => (
          <li key={key}>
            <Link href={knowledgeArticles[key].path} prefetch={false}>
              {knowledgeArticles[key].title}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/produkter/varmeplagg" prefetch={false}>
            Se alle varmeplagg
          </Link>
        </li>
        {article.slug === "cloudweave" && (
          <li>
            <Link href="/produkter/utekos-techdown" prefetch={false}>
              Utekos TechDown™ med CloudWeave™
            </Link>
          </li>
        )}
        {(article.slug === "hvordan-holde-varmen-ute" ||
          article.slug === "hvordan-forlenge-terassesesongen") && (
          <li>
            <Link href="/produkter/terrasse" prefetch={false}>
              Varmeplagg til terrassen
            </Link>
          </li>
        )}
      </ul>
    </section>
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
