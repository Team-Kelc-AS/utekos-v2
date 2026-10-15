import { cx, type Props } from "./shared";
import styles from "./mdx.module.css";

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

export function SizeFitCallout({ className, ...props }: Props<"section">) {
  return (
    <section {...props} className={cx(styles.sizeFitCallout, className)} />
  );
}
