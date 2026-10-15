import { Card } from "@/components/ui/card";
import type { ComponentPropsWithoutRef } from "react";
import { cx } from "./shared";
import styles from "./mdx.module.css";

export function MdxCard({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Card>) {
  return <Card {...props} className={cx(styles.card, className)} />;
}
