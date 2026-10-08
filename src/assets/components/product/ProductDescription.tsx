import 'server-only';

import { load } from 'cheerio/slim';
import { getProductPageContent, getProductPageDescriptionText } from '@/lib/products/content';
import { descriptionPreview } from '@/lib/products/descriptionPreview';
import styles from './ProductDescription.module.css';

export function ProductDescription({ handle, descriptionHtml, maxCharacters = 300 }: {
  handle: string;
  descriptionHtml: string;
  maxCharacters?: number;
}) {
  const content = getProductPageContent(handle)?.description;
  let text = getProductPageDescriptionText(handle);
  if (text === undefined) {
    const $ = load(descriptionHtml);
    $('script, style').remove();
    $('br').replaceWith(' ');
    $('p, li, h2, h3').append(' ');
    text = $.root().text();
  }
  const preview = descriptionPreview(text, maxCharacters);
  if (!preview.text) return null;
  const fullDescription = content ? <>
    {content.lead && <p>{content.lead}</p>}
    {content.blocks.map((block, index) => <div key={index}>
      {block.title && <h3>{block.title}</h3>}
      {block.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      {block.items && <ul>{block.items.map(item => <li key={item}>{item}</li>)}</ul>}
    </div>)}
  </> : <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />;

  return (
    <section className={styles.description} aria-label="Produktbeskrivelse">
      <h2 className={styles.heading}>{content?.title ?? 'Produktbeskrivelse'}</h2>
      {preview.truncated ? <>
        <p className={styles.preview}>{preview.text}</p>
        <details className={styles.disclosure}>
          <summary><span className={styles.more}>Les mer</span><span className={styles.less}>Les mindre</span></summary>
          <div className={styles.full}>{fullDescription}</div>
        </details>
      </> : <div className={styles.full}>{fullDescription}</div>}
    </section>
  );
}
