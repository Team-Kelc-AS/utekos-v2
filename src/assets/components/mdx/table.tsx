import { Table as ShadcnTable } from "@/components/ui/table";
import { cx, type Props } from "./shared";
import styles from "./mdx.module.css";

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

export function MeasurementTable({
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
