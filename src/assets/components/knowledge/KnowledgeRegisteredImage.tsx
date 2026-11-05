import Image from 'next/image';
import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles';
import styles from './knowledgeChrome.module.css';

export function KnowledgeRegisteredImage({ article, caption, imageIndex = 0, preload = false }: { article: KnowledgeArticle; caption?: string; imageIndex?: number; preload?: boolean }) {
  const { caption: imageCaption, ...image } = article.images[imageIndex];
  const visibleCaption = caption ?? imageCaption;
  return <figure className={styles.figure}>
    <Image {...image} alt={image.alt} preload={preload} className={styles.figureImage} style={{ display: 'block', width: '100%', height: 'auto' }}
      sizes="(min-width: 52rem) 47rem, calc(100vw - 2.5rem)" />
    {visibleCaption && <figcaption className={styles.figcaption}>{visibleCaption}</figcaption>}
  </figure>;
}
