import "server-only";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";

import { ProductDetailLabel } from "./ProductDetailLabel";
import { ProductReviewList } from "./ProductReviews";
import { UtekosFAQ } from "./UtekosFAQ";
import { ProductMaterialGuide } from "@/components/knowledge/RelatedContent";
import { Suspense } from "react";
import { getProductPageContent } from "@/lib/products/content";
import styles from "./product.module.css";

export function ProductDetails({
  handle,
  productId,
}: {
  handle: string;
  productId: string;
}) {
  const content = getProductPageContent(handle);
  return (
    <div className={styles.details}>
      {!!content?.accordion?.length && (
        <section
          className={styles.accordion}
          aria-label="Detaljer om produktet"
        >
          <Accordion>
            {content?.accordion?.map((section) => (
              <AccordionItem
                key={section.id}
                id={section.id}
                value={section.id}
              >
                <AccordionTrigger>
                  <ProductDetailLabel section={section.id}>
                    {section.title}
                  </ProductDetailLabel>
                </AccordionTrigger>
                <AccordionContent className={styles.detailBody}>
                  {section.groups.map((group, i) => (
                    <div key={i}>
                      {group.title && <h3>{group.title}</h3>}
                      {group.paragraphs?.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                      {group.rows && (
                        <dl>
                          {group.rows.map((r) => (
                            <div key={r.label}>
                              <dt>{r.label}</dt>
                              <dd>{r.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {group.items && (
                        <ul>
                          {group.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {group.note && (
                        <aside>
                          <strong>{group.note.title}</strong>
                          <p>{group.note.text}</p>
                        </aside>
                      )}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}
      <div className={styles.reviewColumn}>
        <Suspense fallback={null}>
          <ProductReviewList productId={productId} />
        </Suspense>
      </div>
      {handle === "utekos-techdown" && (
        <div className={styles.faqColumn}>
          <UtekosFAQ />
          <div className={styles.faqGuide}>
            <ProductMaterialGuide handle={handle} />
          </div>
        </div>
      )}
    </div>
  );
}
