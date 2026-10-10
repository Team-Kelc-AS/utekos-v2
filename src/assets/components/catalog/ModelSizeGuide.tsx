import 'server-only';
import { getProductSizeGuideDialogContent } from '@/lib/products/getProductSizeGuideContent';
import styles from './camping.module.css';

export function ModelSizeGuide({ product }: { product: { handle: string; title: string } }) {
  const content = getProductSizeGuideDialogContent(product);
  return <details className={styles.details} data-tracking-size-guide>
    <summary>Størrelsesguide</summary>
    <p>{content.description}</p>
    {content.sizeTips.map(tip => <section key={tip.size}><h3>{tip.heading}</h3><p>{tip.heightGuide}</p><ul>{tip.fitGuidance.map(text => <li key={text}>{text}</li>)}</ul></section>)}
    <div className={styles.tableScroll} role="region" aria-label={content.tableAriaLabel} tabIndex={0}>
      <table><caption>{content.tableCaption} – centimeter</caption><thead><tr><th scope="col">{content.rowHeader}</th>{content.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
        <tbody>{content.rows.map(row => <tr key={row.measurement}><th scope="row">{row.measurement}</th>{row.values.map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </details>;
}
