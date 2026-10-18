import Image from "next/image";
import type { KnowledgeArticle } from "@/lib/knowledge/knowledgeArticles";
import Link from "next/link";
import { knowledgeAuthors } from "@/content/authors/knowledgeAuthors";
import styles from "./knowledgeChrome.module.css";
const dateFormatter = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "long",
  timeZone: "Europe/Oslo",
});

function formatTimestamp(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function KnowledgeArticleMeta({
  article,
  className,
}: {
  article: Partial<Pick<KnowledgeArticle, "publishedAt" | "readingMinutes">>;
  className?: string;
}) {
  const author = knowledgeAuthors.utekos;

  return (
    <aside
      className={[styles.authorCard, className].filter(Boolean).join(" ")}
      aria-label="Forfatter og publiseringsinformasjon"
    >
      <div className={styles.logoFrame}>
        <Image
          className={styles.logo}
          src={author.avatarImage.src}
          width={author.avatarImage.width}
          height={author.avatarImage.height}
          sizes="80px"
          alt="Utekos"
        />
      </div>
      <div>
        <p className={styles.authorName}>
          Av{" "}
          <Link className={styles.authorLink} href={author.path} rel="author">
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
