import type { ReactNode } from "react";
import { Signpost } from "lucide-react";
import styles from "./knowledgeChrome.module.css";

export function KnowledgeCalloutTitle({ title }: { title: string }) {
  return (
    <p className={styles.calloutTitle}>
      {/^(tommelregel|tommelfingerregel)/i.test(title) && (
        <Signpost className={styles.calloutIcon} aria-hidden="true" />
      )}
      <span>{title}</span>
    </p>
  );
}

export function KnowledgeCallout({
  title,
  tone = "evidence",
  appearance,
  children,
}: {
  title: string;
  tone?: "evidence" | "note" | "caution";
  appearance?: "dark";
  children: ReactNode;
}) {
  return (
    <aside
      className={styles.callout}
      data-tone={tone}
      data-appearance={appearance}
      aria-label={title}
    >
      <KnowledgeCalloutTitle title={title} />
      <div className={styles.calloutBody}>{children}</div>
    </aside>
  );
}
