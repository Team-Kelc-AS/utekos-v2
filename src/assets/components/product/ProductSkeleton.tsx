import { googleSansFlex } from "@/lib/fonts";
import styles from "./product.module.css";

export function ProductFallback() {
  return (
    <main aria-busy="true" className={`${googleSansFlex.variable} ${styles.page}`}>
      <div className={styles.container}>
        <div className={styles.breadcrumbs} aria-hidden="true">&nbsp;</div>
        <ProductSkeleton />
      </div>
    </main>
  );
}

export function ProductSkeleton() {
  return (
    <div className={styles.productSkeleton} aria-busy="true">
      <p role="status" className="sr-only">Laster produkt …</p>
      <div className={styles.grid} aria-hidden="true">
        <div className={styles.skeletonImage} />
        <div className={styles.skeletonPurchase}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonPrice} />
          <div className={styles.skeletonOptions} />
          <div className={styles.skeletonAction} />
          <div className={styles.skeletonAction} />
        </div>
      </div>
    </div>
  );
}
