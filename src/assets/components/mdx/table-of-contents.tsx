import styles from "./mdx.module.css";

export type TocEntry = {
  id: string;
  label: string;
  description?: string;
  children?: readonly TocEntry[];
};
export type TableOfContentsProps = {
  entries: readonly TocEntry[];
  title?: string;
  id?: string;
  collapsible?: boolean;
  bordered?: boolean;
};
function TocList({ entries }: { entries: readonly TocEntry[] }) {
  return (
    <ol>
      {entries.map((entry) => (
        <li key={entry.id}>
          <a href={`#${encodeURIComponent(entry.id)}`}>
            {entry.label}
            {entry.description ? <small>{entry.description}</small> : null}
          </a>
          {entry.children?.length ? <TocList entries={entry.children} /> : null}
        </li>
      ))}
    </ol>
  );
}
export function TableOfContents({
  entries,
  title = "Innhold",
  id,
  collapsible = false,
  bordered = true,
}: TableOfContentsProps) {
  if (!entries.length) return null;
  return (
    <nav
      className={styles.toc}
      data-bordered={bordered}
      aria-label={id ? undefined : title}
      aria-labelledby={id}
    >
      {collapsible ? (
        <details>
          <summary id={id}>{title}</summary>
          <TocList entries={entries} />
        </details>
      ) : (
        <>
          <p id={id} className={styles.tocTitle}>
            {title}
          </p>
          <TocList entries={entries} />
        </>
      )}
    </nav>
  );
}

// Preserve the source article APIs while sharing this MDX presentation layer.
export function ArticleTableOfContents({
  title = "Innhold i artikkelen",
  id = "article-contents",
  entries,
}: Omit<TableOfContentsProps, "collapsible">) {
  return (
    <TableOfContents title={title} id={id} entries={entries} collapsible />
  );
}
