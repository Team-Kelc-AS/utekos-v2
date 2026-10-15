import type { ComponentPropsWithoutRef } from "react";

export type Props<Tag extends keyof React.JSX.IntrinsicElements> =
  ComponentPropsWithoutRef<Tag>;
export const cx = (...values: (string | undefined)[]) =>
  values.filter(Boolean).join(" ");
