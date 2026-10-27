import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { comparisonRows, modelRecommendations } from "../utils/comparisonData";

import { TableCellContent } from "./TableCellContent";
import { comparisonGuideClasses as styles } from "../comparisonGuideClasses";

export function ComparisonAccordion() {
  return (
    <Accordion multiple={false} defaultValue={[]} className={styles.faq}>
      {modelRecommendations.map((model) => (
        <AccordionItem key={model.key} value={model.key} className={styles.faqItem}>
          <AccordionTrigger className={styles.faqTrigger}>{model.name}</AccordionTrigger>
          <AccordionContent keepMounted>
            <dl className={styles.modelDetails}>
              {comparisonRows.map((row) => (
                <div key={row.feature}>
                  <dt>{row.feature}</dt>
                  <dd>
                    <TableCellContent value={row.values[model.key]} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className={styles.note}>
              <a className={styles.citation} href={model.href}>
                Produktopplysninger for {model.name}
              </a>
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
