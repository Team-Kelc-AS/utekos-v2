import Image from 'next/image';
import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles';
import styles from './knowledgeChrome.module.css';

export function KnowledgeRegisteredImage({ article, caption }: { article: KnowledgeArticle; caption?: string }) {
  const image = article.images[0];
  return <figure className={styles.figure}>
    <Image {...image} alt={image.alt} className={styles.figureImage} style={{ display: 'block', width: '100%', height: 'auto' }}
      sizes="(min-width: 52rem) 47rem, calc(100vw - 2.5rem)" />
    {caption && <figcaption className={styles.figcaption}>{caption}</figcaption>}
  </figure>;
}
