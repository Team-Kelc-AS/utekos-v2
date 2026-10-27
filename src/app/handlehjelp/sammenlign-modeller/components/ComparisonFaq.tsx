import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/Accordion'
import { faqItems } from '../utils/comparisonData'
import { comparisonGuideClasses as styles } from '../comparisonGuideClasses'

export function ComparisonFaq() {
  return (
    <Accordion
      multiple={false}
      defaultValue={[]}
      className={styles.faq}
    >
      {faqItems.map(item => (
        <AccordionItem key={item.question} value={item.question} className={styles.faqItem}>
          <AccordionTrigger className={styles.faqTrigger}>{item.question}</AccordionTrigger>
          <AccordionContent keepMounted>
            <p>{item.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
