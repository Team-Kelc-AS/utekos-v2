import 'server-only';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { getProductSizeGuideContent } from '@/lib/products/getProductSizeGuideContent';
import { resolveProductSizeGuideFamily } from '@/lib/products/resolveProductSizeGuideFamily';
import styles from './product.module.css';
import { ProductDetailLabel } from './ProductDetailLabel';
export function ProductSizeGuide({ handle }: { handle: string }) {
  if (!['utekos-techdown', 'utekos-mikrofiber', 'utekos-dun', 'comfyrobe'].includes(handle)) return null;
  const content = getProductSizeGuideContent(resolveProductSizeGuideFamily(handle));
  return <AccordionItem data-tracking-size-guide id="storrelser" value="storrelser"><AccordionTrigger><ProductDetailLabel section="storrelser">Størrelsesguide</ProductDetailLabel></AccordionTrigger><AccordionContent className={styles.detailBody}>
    <p>{content.description}</p>
    {content.sizeTips.map(tip => <section key={tip.size}><h3>{tip.heading}</h3><p>{tip.heightGuide}</p><ul>{tip.fitGuidance.map(text => <li key={text}>{text}</li>)}</ul></section>)}
    <p>Brystvidden i tabellen er plaggets flatmål, ikke kroppens brystomkrets. Sammenlign med et plagg som sitter godt.</p>
    <div className={styles.tableScroll} role="region" aria-label={content.tableAriaLabel} tabIndex={0}><table><caption>{content.tableCaption} – centimeter</caption><thead><tr><th scope="col">{content.rowHeader}</th>{content.columns.map(c => <th scope="col" key={c}>{c}</th>)}</tr></thead><tbody>{content.rows.map(row => <tr key={row.measurement}><th scope="row">{row.measurement}</th>{row.values.map((v, i) => <td key={i}>{v}</td>)}</tr>)}</tbody></table></div>
  </AccordionContent></AccordionItem>;
}
