import "server-only";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { knowledgeArticleList } from "@/lib/knowledge/knowledgeArticles";
import { rankMostReadArticles } from "@/lib/knowledge/mostReadArticles";
import { getArticleReadership } from "@/lib/knowledge/getArticleReadership";
import styles from "./MostReadArticles.module.css";

const dateFormatter = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Oslo",
});

export async function MostReadArticles({ currentSlug }: { currentSlug: string }) {
  const data = await getArticleReadership();
  const articles = rankMostReadArticles(knowledgeArticleList, data.rows);
  if (articles.length !== 5) throw new Error("Five measured articles are required for most-read recommendations");
  const period = dateFormatter.formatRange(
    new Date(`${data.startDate}T12:00:00Z`),
    new Date(`${data.endDate}T12:00:00Z`),
  );

  return (
    <section
      className={styles.section}
      aria-labelledby="mest-leste-artikler"
      data-most-read-articles
      data-readership-updated-at={data.fetchedAt}
    >
      <h2 id="mest-leste-artikler" className={styles.heading}>De 5 mest leste artiklene</h2>
      <p className={styles.period}>Basert på artikkelvisninger {period}.</p>
      <ol className={styles.list}>
        {articles.map(({ article }, index) => (
          <li key={article.slug}>
            <Link
              className={styles.link}
              href={article.path}
              prefetch={false}
              aria-current={article.slug === currentSlug ? "page" : undefined}
            >
              <Card className={styles.card}>
                <span className={styles.rank} aria-hidden="true">{index + 1}</span>
                <Image {...article.cardImage} alt="" sizes="(max-width: 639px) 72px, 112px" className={styles.image} />
                <div className={styles.copy}>
                  <span className={styles.category}>{article.articleSection}</span>
                  <h3>{article.title}</h3>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
