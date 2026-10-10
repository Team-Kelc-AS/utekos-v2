import Image from "next/image";
import type { KnowledgeArticle } from "@/lib/knowledge/knowledgeArticles";
import Link from "next/link";
import { knowledgeAuthors } from "@/content/authors/knowledgeAuthors";
import styles from "./knowledgeChrome.module.css";
const dateFormatter = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Oslo",
});

function formatTimestamp(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat("nb-NO", {
      dateStyle: "long",
      timeZone: "Europe/Oslo",
    }).format(new Date(value));
  }
  return dateFormatter.format(new Date(value));
}

export function KnowledgeArticleMeta({
  article,
}: {
  article: Partial<Pick<KnowledgeArticle, "publishedAt" | "readingMinutes">>;
}) {
  const author = knowledgeAuthors.utekos;

  return (
    <aside
      className={styles.authorCard}
      aria-label="Forfatter og publiseringsinformasjon"
    >
      <div className={styles.logoFrame}>
        <Image
          className={styles.logo}
          src={author.avatarImage}
          width={96}
          height={96}
          sizes="80px"
          alt="Utekos"
        />
      </div>
      <div>
        <p className={styles.authorName}>
          Av{" "}
          <Link className={styles.authorLink} href={author.url} rel="author">
            {author.name}
          </Link>
        </p>
        {article.publishedAt || article.readingMinutes ? (
          <p className={styles.publicationLine}>
            {article.publishedAt ? (
              <>
                Publisert{" "}
                <time dateTime={article.publishedAt}>
                  {formatTimestamp(article.publishedAt)}
                </time>
              </>
            ) : null}
            {article.publishedAt && article.readingMinutes ? " · " : null}
            {article.readingMinutes
              ? `${article.readingMinutes} min lesetid`
              : null}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
