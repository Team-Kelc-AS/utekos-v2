import type { KnowledgeArticle } from "@/lib/knowledge/knowledgeArticles";
import Link from "next/link";
import { knowledgeAuthors } from "@/content/authors/knowledgeAuthors";
import styles from "./knowledgeChrome.module.css";

const dateFormatter = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "long",
  timeZone: "Europe/Oslo",
});
const monthFormatter = new Intl.DateTimeFormat("nb-NO", {
  month: "long",
  year: "numeric",
  timeZone: "Europe/Oslo",
});

type ArticleMeta = Pick<
  KnowledgeArticle,
  "publishedAt" | "publishedMonth" | "updatedAt" | "readingMinutes" | "wordCount" | "showReadingTime"
>;

export function KnowledgeArticleMeta({
  article,
  className,
}: {
  article: ArticleMeta;
  className?: string;
}) {
  const author = knowledgeAuthors.utekos;
  // For an article without a later recorded revision, its first version is the latest known version.
  const exactDate = article.updatedAt ?? article.publishedAt;
  const updatedDate = exactDate ?? article.publishedMonth;
  const updatedLabel = exactDate
    ? dateFormatter.format(new Date(exactDate))
    : article.publishedMonth
      ? monthFormatter.format(new Date(`${article.publishedMonth}-01T12:00:00Z`))
      : undefined;

  return (
    <div
      className={[styles.articleMeta, className].filter(Boolean).join(" ")}
      aria-label="Forfatter, oppdatering og lesetid"
      data-article-meta
    >
      <span>
        Av{" "}
        <Link className={styles.authorLink} href={author.path} rel="author">
          {author.name}
        </Link>
      </span>
      {updatedDate ? (
        <>
          <span aria-hidden="true">·</span>
          <span>
            Oppdatert <time dateTime={updatedDate}>{updatedLabel}</time>
          </span>
        </>
      ) : null}
      {article.showReadingTime !== false && article.readingMinutes ? (
        <>
          <span aria-hidden="true">·</span>
          <span data-reading-words={article.wordCount}>
            {article.readingMinutes} min lesetid
          </span>
        </>
      ) : null}
    </div>
  );
}
