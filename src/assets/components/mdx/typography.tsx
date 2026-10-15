import type { MDXComponents } from "mdx/types";
import type { CalloutType } from "./document-callout";
import { MdxLink } from "./link";
import { Details, Summary } from "./disclosure";
import { Table } from "./table";
import { cx, type Props } from "./shared";
import styles from "./mdx.module.css";

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

export const mdxTypography = {
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
} satisfies MDXComponents;
