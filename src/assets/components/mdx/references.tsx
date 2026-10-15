import { MdxLink } from "./link";
import styles from "./mdx.module.css";

export type ArticleReference = {
  id: string;
  number: number;
  author: string;
  title: string;
  year: string;
  url: string;
  description: string;
};

export function ArticleReferences({
  references,
  idPrefix = "reference-",
}: {
  references: readonly ArticleReference[];
  idPrefix?: string;
}) {
  if (!references.length) return null;
  return (
    <ol className={styles.references}>
      {references.map((reference) => (
        <li
          key={reference.id}
          id={`${idPrefix}${reference.id}`}
          value={reference.number}
        >
          <p>
            {reference.author} ({reference.year}).{" "}
            <cite>
              <MdxLink href={reference.url}>{reference.title}</MdxLink>
            </cite>
            .
          </p>
          <p>{reference.description}</p>
        </li>
      ))}
    </ol>
  );
}

/** Keeps the existing Cite contract, including custom targets for
 * ArticleReferences. Default #kilde-N matches KnowledgeSources + References.
 * Repeated citations deliberately have no ID: no duplicate DOM IDs.
 */
export type CitationTargets = Readonly<
  Record<number, { id: string; label: string }>
>;
export function Cite({
  ids,
  targets,
}: {
  ids: readonly number[];
  targets?: CitationTargets;
}) {
  const unique = [...new Set(ids)];
  if (unique.some((id) => !Number.isSafeInteger(id) || id < 1))
    throw new Error("Cite: kildeindekser må være positive heltall.");
  if (targets && unique.some((id) => !targets[id]))
    throw new Error("Cite: kilde mangler i targets.");
  if (!unique.length) return null;
  return (
    <sup className={styles.citation}>
      [
      {unique.map((id, index) => (
        <span key={id}>
          {index ? ", " : null}
          <a
            href={`#${encodeURIComponent(targets?.[id]?.id ?? `kilde-${id}`)}`}
            aria-label={targets?.[id]?.label ?? `Se kilde ${id}`}
          >
            {id}
          </a>
        </span>
      ))}
      ]
    </sup>
  );
}

/** Structurally compatible with KnowledgeReference from the article registry. */
export type Reference = {
  title: string;
  attribution: string;
  url?: string;
  suffix?: string;
};
export function References({
  references,
  title = "Kilder",
  idPrefix = "kilde-",
}: {
  references: readonly Reference[];
  title?: string;
  idPrefix?: string;
}) {
  if (!references.length) return null;
  return (
    <section className={styles.references} aria-label={title}>
      <p className={styles.referencesTitle}>
        {title} ({references.length})
      </p>
      <ol>
        {references.map((reference, index) => (
          <li key={`${idPrefix}${index + 1}`} id={`${idPrefix}${index + 1}`}>
            {reference.attribution}.{" "}
            <cite>
              {reference.url ? (
                <MdxLink href={reference.url}>{reference.title}</MdxLink>
              ) : (
                reference.title
              )}
            </cite>
            {reference.suffix ? <> {reference.suffix}</> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
