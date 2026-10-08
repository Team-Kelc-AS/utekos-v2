import "server-only";

import NewsletterForm from "./NewsletterForm";
import styles from "./Newsletter.module.css";

export default function Newsletter() {
  return (
    <div className={styles.section}>
      <section aria-labelledby="footer-newsletter-heading" className={styles.card}>
        <div className={styles.content}>
          <div className={styles.headingRow}>
            <span className={styles.icon} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 6 9 7 9-7" />
            </svg>
            </span>
            <h2 id="footer-newsletter-heading" className={styles.heading}>Meld deg på Utekos sitt nyhetsbrev!</h2>
          </div>
          <div className={styles.description}>
            <p>Som medlem i vår kundeklubb får du personlige varsler om tilbud, salg og kampanjer.</p>
            <p>Du får også tips, inspirasjon og nye artikler fra Utekos-magasinet.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
