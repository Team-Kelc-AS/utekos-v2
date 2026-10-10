import "server-only";

import { NBCC_PATH } from "@/lib/nbcc/content";
import { StockedProducts } from "@/components/ProductCard/StockedProducts";
import styles from "./nbcc.module.css";

export default function NbccProductSection() {
  return (
    <StockedProducts
      title="Utekos-plagg for NBCC-medlemmer"
      headingId="nbcc-produkter"
      listId="nbcc-products"
      route={NBCC_PATH}
      introduction={
        <div className={styles.productIntro}>
          <p>Prisene vises før medlemsrabatt.</p>
        </div>
      }
    />
  );
}
