import "server-only";

import type { ReactNode } from "react";
import styles from "./ImageHoverZoom.module.css";

export function ImageHoverZoom({ children }: { children: ReactNode }) {
  return (
    <span className={`${styles.wrapper} rounded-lg`} data-image-hover-zoom>
      {children}
    </span>
  );
}
