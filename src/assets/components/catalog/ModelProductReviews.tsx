import 'server-only';
import { io } from 'next/dist/server/request/io';
import { getJudgeMePreview } from '@/lib/products/judgeme';
import styles from './camping.module.css';

export async function ModelProductReviews({ productId }: { productId: string }) {
  await io();
  const data = await getJudgeMePreview(productId);
  if (!data) return <p className={styles.reviewStatus}>Omtalene er ikke tilgjengelige akkurat nå.</p>;
  if (!data.count) return <p className={styles.reviewStatus}>Ingen publiserte omtaler ennå.</p>;
  return <details className={styles.reviews}>
    <summary><span aria-hidden="true" className={styles.stars}>★</span> {new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 }).format(data.average)} av 5 · {data.count} {data.count === 1 ? 'omtale' : 'omtaler'} <span className={styles.reviewProvider}>Judge.me</span></summary>
    <ul>{data.reviews.map(review => <li key={review.id}>
      <p><strong>{review.author}</strong> · {review.rating} av 5{review.verified && ' · Verifisert kjøper'}</p>
      {review.title && <h4>{review.title}</h4>}
      <p className={styles.reviewBody}>{review.body}</p>
    </li>)}</ul>
  </details>;
}
