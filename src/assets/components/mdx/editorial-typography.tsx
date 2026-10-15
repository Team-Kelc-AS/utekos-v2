// Optional editorial styling; the global registry preserves the established document styles.
import type { MDXComponents } from "mdx/types";

export const mdxEditorialTypography: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="max-w-3xl text-left text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-14 mb-3 text-left text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 text-left text-xl font-extrabold text-foreground">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-3 max-w-3xl text-left text-base font-medium leading-relaxed text-muted-foreground">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-2 pl-5 text-left text-sm font-medium leading-relaxed text-muted-foreground marker:text-primary">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-2.5 pl-5 text-left text-sm font-medium leading-relaxed text-foreground marker:font-extrabold marker:text-primary">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-5 rounded-xl border border-border border-l-4 border-l-primary bg-muted px-5 py-4 text-left text-sm font-medium text-muted-foreground [&_p]:my-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-12 border-border" />,
};
