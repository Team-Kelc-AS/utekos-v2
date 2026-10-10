/**
 * Utekos MDX foundation. Place at the repository root, beside
 * mdx-components.module.css. Uses the existing @next/mdx + rehype-slug pipeline.
 * No client directive/provider.
 *
 * Uteguiden: KnowledgeArticleScaffold owns H1, byline, ToC and sources.
 * Keep those out of its MDX body. Other documents can use ArticleMeta,
 * TableOfContents and References explicitly.
 */
import type { MDXComponents } from "mdx/types";
import type { Route } from "next";
import Link from "next/link";
import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { ArticleImage } from "@/components/knowledge/ArticleImage";
import { KnowledgeCallout } from "@/components/knowledge/KnowledgeCallout";
import { KnowledgeArticleMeta } from "@/components/knowledge/KnowledgeArticleMeta";
import { SizeGuideCallout } from "@/components/size-guide/SizeGuideCallout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { googleSansFlex } from "@/lib/fonts";
import styles from "./mdx-components.module.css";

type Props<Tag extends keyof React.JSX.IntrinsicElements> =
  ComponentPropsWithoutRef<Tag>;
const cx = (...values: (string | undefined)[]) =>
  values.filter(Boolean).join(" ");

function MdxLink({
  href,
  className,
  rel,
  target,
  download,
  children,
  ...props
}: Props<"a">) {
  const safeRel =
    target === "_blank"
      ? [
          ...new Set(`${rel ?? ""} noopener noreferrer`.trim().split(/\s+/u)),
        ].join(" ")
      : rel;
  const shared = {
    ...props,
    className: cx(styles.link, className),
    rel: safeRel,
    target,
  };
  if (
    href?.startsWith("/") &&
    !href.startsWith("//") &&
    !href.includes("\\") &&
    download == null
  ) {
    return (
      <Link {...shared} href={href as Route} prefetch={false}>
        {children}
      </Link>
    );
  }
  return (
    <a {...shared} href={href} download={download}>
      {children}
    </a>
  );
}

function heading(Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  function Heading({ className, ...props }: Props<"h1">) {
    // IDs belong to rehype-slug: no per-render counters or second slug algorithm.
    return (
      <Tag {...props} className={cx(styles.heading, styles[Tag], className)} />
    );
  }
  return Heading;
}
const H1 = heading("h1");
const H2 = heading("h2");
const H3 = heading("h3");
const H4 = heading("h4");
const H5 = heading("h5");
const H6 = heading("h6");

function Paragraph({ className, ...props }: Props<"p">) {
  return <p {...props} className={cx(styles.paragraph, className)} />;
}
function UnorderedList({ className, ...props }: Props<"ul">) {
  return <ul {...props} className={cx(styles.unorderedList, className)} />;
}
function OrderedList({ className, ...props }: Props<"ol">) {
  return <ol {...props} className={cx(styles.orderedList, className)} />;
}

// Explicit JSX tags bypass MDX's lowercase mappings. Named aliases let MDX
// documents reuse the native disclosure styles without adding client code.
function Details({ className, ...props }: Props<"details">) {
  return <details {...props} className={cx(styles.details, className)} />;
}
function Summary({ className, ...props }: Props<"summary">) {
  return <summary {...props} className={cx(styles.summary, className)} />;
}

const calloutLabels = {
  note: "Merk",
  tip: "Tips",
  important: "Viktig",
  warning: "Advarsel",
  caution: "Vær oppmerksom",
} as const;
export type CalloutType = keyof typeof calloutLabels;
export type CalloutProps = Omit<Props<"aside">, "title"> & {
  type?: CalloutType;
  title?: string;
};

export function Callout({
  type = "note",
  title,
  children,
  className,
  ...props
}: CalloutProps) {
  const label = title ?? calloutLabels[type];
  return (
    <aside
      {...props}
      className={cx(styles.callout, className)}
      data-callout={type}
      aria-label={props["aria-label"] ?? label}
    >
      <p className={styles.calloutTitle}>{label}</p>
      <div className={styles.calloutBody}>{children}</div>
    </aside>
  );
}

function SizeFitCallout({ className, ...props }: Props<"section">) {
  return (
    <section {...props} className={cx(styles.sizeFitCallout, className)} />
  );
}

function MdxCard({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Card>) {
  return <Card {...props} className={cx(styles.card, className)} />;
}

function Blockquote({ className, ...props }: Props<"blockquote">) {
  return <blockquote {...props} className={cx(styles.blockquote, className)} />;
}

function Aside({
  className,
  ...props
}: Props<"aside"> & { "data-callout"?: CalloutType }) {
  return (
    <aside
      {...props}
      className={cx(
        props["data-callout"] ? styles.callout : undefined,
        className,
      )}
    />
  );
}

function Nav({
  className,
  ...props
}: Props<"nav"> & { "data-mdx-toc"?: string }) {
  return (
    <nav
      {...props}
      className={cx(
        props["data-mdx-toc"] != null ? styles.toc : undefined,
        className,
      )}
    />
  );
}

/** Native img is intentional: Markdown doesn't supply intrinsic dimensions.
 * Use the existing ArticleImage for optimized editorial images with a known
 * aspect ratio and its required generation prompt. Never guess width/height.
 */
function MarkdownImage({
  alt = "",
  className,
  loading = "lazy",
  decoding = "async",
  ...props
}: Props<"img">) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- intrinsic size absent in Markdown
    <img
      {...props}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={cx(styles.image, className)}
    />
  );
}

export type TableProps = Props<"table"> & { scrollLabel?: string };
export function Table({
  className,
  scrollLabel = "Tabell – rull vannrett for å se flere kolonner",
  ...props
}: TableProps) {
  return (
    <div
      className={styles.tableScroll}
      role="region"
      aria-label={scrollLabel}
      tabIndex={0}
    >
      <table {...props} className={cx(styles.table, className)} />
    </div>
  );
}

function MeasurementTable({
  className,
  scrollable = false,
  ...props
}: Props<"table"> & { scrollable?: boolean }) {
  return (
    <>
      {scrollable ? (
        <p className={styles.measurementScrollHint}>
          Rull sidelengs for å se alle størrelsene.
        </p>
      ) : null}
      <div
        className={cx(
          styles.measurementTable,
          scrollable ? styles.measurementTableScrollable : undefined,
        )}
      >
        <ShadcnTable
          {...props}
          tabIndex={scrollable ? 0 : props.tabIndex}
          className={className}
        />
      </div>
    </>
  );
}

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

export function ArticleSection({
  id,
  labelledBy,
  tone = "default",
  children,
}: {
  id?: string;
  labelledBy: string;
  tone?: "default" | "contrast";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-tone={tone}
      className={styles.section}
    >
      {children}
    </section>
  );
}

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
export type ArticleMetaProps = {
  author: { name: string; href?: string };
  publishedAt: string;
  updatedAt?: string;
  readingMinutes?: number;
};
export function ArticleMeta({
  author,
  publishedAt,
  updatedAt,
  readingMinutes,
}: ArticleMetaProps) {
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

/** Styling boundary only; heading IDs are generated by rehype-slug. */
function MdxContent({ children }: { children?: ReactNode }) {
  return (
    <div className={cx(googleSansFlex.variable, styles.content)}>
      {children}
    </div>
  );
}

const components = {
  wrapper: MdxContent,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  p: Paragraph,
  a: MdxLink,
  ul: UnorderedList,
  ol: OrderedList,
  li: ({ className, ...props }: Props<"li">) => (
    <li {...props} className={cx(styles.listItem, className)} />
  ),
  blockquote: Blockquote,
  aside: Aside,
  nav: Nav,
  hr: ({ className, ...props }: Props<"hr">) => (
    <hr {...props} className={cx(styles.rule, className)} />
  ),
  strong: ({ className, ...props }: Props<"strong">) => (
    <strong {...props} className={cx(styles.strong, className)} />
  ),
  em: (props: Props<"em">) => <em {...props} />,
  del: (props: Props<"del">) => <del {...props} />,
  cite: ({ className, ...props }: Props<"cite">) => (
    <cite {...props} className={cx(styles.workTitle, className)} />
  ),
  sup: (props: Props<"sup">) => <sup {...props} />,
  sub: (props: Props<"sub">) => <sub {...props} />,
  abbr: (props: Props<"abbr">) => <abbr {...props} />,
  kbd: ({ className, ...props }: Props<"kbd">) => (
    <kbd {...props} className={cx(styles.kbd, className)} />
  ),
  pre: ({ className, ...props }: Props<"pre">) => (
    <pre
      {...props}
      tabIndex={props.tabIndex ?? 0}
      className={cx(styles.pre, className)}
    />
  ),
  code: ({ className, ...props }: Props<"code">) => (
    <code {...props} className={cx(styles.code, className)} />
  ),
  img: MarkdownImage,
  figure: ({ className, ...props }: Props<"figure">) => (
    <figure {...props} className={cx(styles.figure, className)} />
  ),
  figcaption: ({ className, ...props }: Props<"figcaption">) => (
    <figcaption {...props} className={cx(styles.figcaption, className)} />
  ),
  table: Table,
  caption: ({ className, ...props }: Props<"caption">) => (
    <caption {...props} className={cx(styles.caption, className)} />
  ),
  thead: (props: Props<"thead">) => <thead {...props} />,
  tbody: (props: Props<"tbody">) => <tbody {...props} />,
  tfoot: (props: Props<"tfoot">) => <tfoot {...props} />,
  tr: (props: Props<"tr">) => <tr {...props} />,
  th: ({ scope = "col", ...props }: Props<"th">) => (
    <th {...props} scope={scope} />
  ),
  td: (props: Props<"td">) => <td {...props} />,
  details: Details,
  summary: Summary,
  dl: ({ className, ...props }: Props<"dl">) => (
    <dl {...props} className={cx(styles.definitionList, className)} />
  ),
  dt: (props: Props<"dt">) => <dt {...props} />,
  dd: (props: Props<"dd">) => <dd {...props} />,
  // Existing names retained for current MDX documents.
  ArticleImage,
  KnowledgeCallout,
  SizeGuideCallout,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Card: MdxCard,
  CardHeader,
  CardTitle,
  CardContent,
  MeasurementTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ArticleTableOfContents,
  ArticleSection,
  ArticleReferences,
  KnowledgeArticleMeta,
  // Shared primitives for new documents, no per-document imports needed.
  Callout,
  SizeFitCallout,
  Cite,
  References,
  ArticleMeta,
  TableOfContents,
  Details,
  Summary,
  Table,
} satisfies MDXComponents;

declare global {
  type MDXProvidedComponents = typeof components;
}

// Current Next.js convention: zero arguments. Local MDX overrides belong on
// <Content components={...} />; the compiler merges those with this registry.
export function useMDXComponents(): MDXComponents {
  return components;
}
