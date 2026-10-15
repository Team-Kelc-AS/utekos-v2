import type { ReactNode } from "react";
import styles from "./mdx.module.css";

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
