import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { MdxLink } from "./link";

function TypesetContent({ children }: { children?: ReactNode }) {
  return <div className="typeset typeset-docs max-w-[42em]">{children}</div>;
}

/** Opt in per document: keep Markdown semantic and let Typeset own typography. */
export const typesetComponents = {
  wrapper: TypesetContent,
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  p: "p",
  a: (props) => <MdxLink {...props} typography="inherit" />,
  ul: "ul",
  ol: "ol",
  li: "li",
  blockquote: "blockquote",
  aside: "aside",
  nav: "nav",
  hr: "hr",
  strong: "strong",
  em: "em",
  del: "del",
  cite: "cite",
  sup: "sup",
  sub: "sub",
  abbr: "abbr",
  kbd: "kbd",
  pre: (props) => <pre {...props} tabIndex={props.tabIndex ?? 0} />,
  code: "code",
  img: ({ alt = "", loading = "lazy", decoding = "async", ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element -- Markdown has no intrinsic dimensions.
    <img {...props} alt={alt} loading={loading} decoding={decoding} />
  ),
  figure: "figure",
  figcaption: "figcaption",
  table: "table",
  caption: "caption",
  thead: "thead",
  tbody: "tbody",
  tfoot: "tfoot",
  tr: "tr",
  th: ({ scope = "col", ...props }) => <th {...props} scope={scope} />,
  td: "td",
  details: "details",
  summary: "summary",
  dl: "dl",
  dt: "dt",
  dd: "dd",
} satisfies MDXComponents;
