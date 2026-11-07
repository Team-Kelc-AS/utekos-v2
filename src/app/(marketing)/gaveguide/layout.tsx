import type { ReactNode } from "react";
import styles from "./gift-guide.module.css";

export default function GiftGuideLayout({ children }: { children: ReactNode }) {
  return <main className={styles.page} data-gift-guide>{children}</main>;
}
