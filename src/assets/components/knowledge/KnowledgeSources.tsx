import type { KnowledgeArticle } from "@/lib/knowledge/knowledgeArticles";
import Link from "next/link";
import styles from "./knowledgeChrome.module.css";
export function KnowledgeSources({
  article,
}: {
  article: Pick<KnowledgeArticle, "slug" | "references">;
}) {
  const headingId = `${article.slug}-kilder`;

  return (
    <section className={styles.sources} aria-labelledby={headingId}>
      <details className={styles.sourcesDetails}>
        <summary className={styles.sourcesSummary}>
          <span id={headingId}>Kilder ({article.references.length})</span>
        </summary>
        <ol className={styles.sourcesList}>
          {article.references.map((reference, index) => (
            <li
              key={`${reference.attribution}-${reference.title}`}
              id={`kilde-${index + 1}`}
              className={styles.sourcesItem}
            >
              <span>{reference.attribution}. </span>
              {reference.url && !reference.linkLabel ? (
                <Link href={reference.url} rel="noopener noreferrer">
                  <cite className={styles.sourcesTitle}>{reference.title}</cite>
                </Link>
              ) : (
                <cite className={styles.sourcesTitle}>{reference.title}</cite>
              )}
              {reference.suffix ? <span>{reference.suffix}</span> : null}
              {reference.url && reference.linkLabel ? (
                <>
                  {" "}
                  <Link href={reference.url} rel="noopener noreferrer">
                    {reference.linkLabel}
                  </Link>
                </>
              ) : null}
              {reference.additionalLinks?.map((link) => (
                <span key={link.url}>
                  {" · "}
                  <a href={link.url} rel="noopener noreferrer">
                    {link.label}
                  </a>
                </span>
              ))}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
