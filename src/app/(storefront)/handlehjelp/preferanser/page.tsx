import type { Metadata } from "next";
import { KlarnaPreferencesContent } from "@/components/klarna/KlarnaPreferencesAccess";
import styles from "@/components/klarna/KlarnaMarketingPreferences.module.css";

export const metadata: Metadata = {
  title: "Mine preferanser og samtykker | Utekos",
  robots: { index: false, follow: true },
};
export default function PreferencesPage() {
  return (
    <main className={styles.page}>
      <div className={styles.theme}>
        <h1>Mine preferanser og samtykker</h1>
        <KlarnaPreferencesContent />
      </div>
    </main>
  );
}
