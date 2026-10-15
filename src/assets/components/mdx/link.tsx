import type { Route } from "next";
import Link from "next/link";
import { cx, type Props } from "./shared";
import styles from "./mdx.module.css";

export function MdxLink({
  href,
  className,
  rel,
  target,
  download,
  children,
  typography = "default",
  ...props
}: Props<"a"> & { typography?: "default" | "inherit" }) {
  const safeRel =
    target === "_blank"
      ? [
          ...new Set(`${rel ?? ""} noopener noreferrer`.trim().split(/\s+/u)),
        ].join(" ")
      : rel;
  const shared = {
    ...props,
    className: cx(typography === "default" ? styles.link : undefined, className),
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
      // MDX literals are checked against generated routes by build and typecheck.
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
