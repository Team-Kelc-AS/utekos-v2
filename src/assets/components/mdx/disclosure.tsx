import { cx, type Props } from "./shared";
import styles from "./mdx.module.css";

// Explicit JSX tags bypass MDX's lowercase mappings. Named aliases let MDX
// documents reuse the native disclosure styles without adding client code.
export function Details({ className, ...props }: Props<"details">) {
  return <details {...props} className={cx(styles.details, className)} />;
}
export function Summary({ className, ...props }: Props<"summary">) {
  return <summary {...props} className={cx(styles.summary, className)} />;
}
