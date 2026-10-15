import type { Route } from "next";
import { MdxLink } from "./link";
import styles from "./mdx.module.css";

const dateOnlyFormatter = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "long",
  timeZone: "Europe/Oslo",
});
const timestampFormatter = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Oslo",
});
function formatDate(value: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/u.test(value);
  const timestamp =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(
      value,
    );
  const date = new Date(dateOnly ? `${value}T00:00:00Z` : value);
  const calendar = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (
    (!dateOnly && !timestamp) ||
    Number.isNaN(date.valueOf()) ||
    Number.isNaN(calendar.valueOf()) ||
    calendar.toISOString().slice(0, 10) !== value.slice(0, 10)
  ) {
    throw new Error(
      `ArticleMeta: ugyldig dato "${value}". Bruk YYYY-MM-DD eller ISO-tid med tidssone.`,
    );
  }
  return (dateOnly ? dateOnlyFormatter : timestampFormatter).format(date);
}
export type ArticleMetaProps<T extends string = string> = {
  author: { name: string; href?: Route<T> };
  publishedAt: string;
  updatedAt?: string;
  readingMinutes?: number;
};
export function ArticleMeta<T extends string>({
  author,
  publishedAt,
  updatedAt,
  readingMinutes,
}: ArticleMetaProps<T>) {
  if (
    readingMinutes != null &&
    (!Number.isFinite(readingMinutes) || readingMinutes <= 0)
  )
    throw new Error("ArticleMeta: lesetid må være positiv.");
  return (
    <aside
      className={styles.meta}
      aria-label="Forfatter og publiseringsinformasjon"
    >
      <p>
        Av{" "}
        {author.href ? (
          <MdxLink href={author.href} rel="author">
            {author.name}
          </MdxLink>
        ) : (
          author.name
        )}
      </p>
      <p>
        Publisert <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
        {updatedAt && updatedAt !== publishedAt ? (
          <>
            {" "}
            · Oppdatert{" "}
            <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
          </>
        ) : null}
        {readingMinutes != null ? <> · {readingMinutes} min lesetid</> : null}
      </p>
    </aside>
  );
}
