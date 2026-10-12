import 'server-only';
import Image from 'next/image';
import { io } from 'next/dist/server/request/io';
import { getJudgeMePreview } from '@/lib/products/judgeme';
import { InfoDialogButton } from './InfoDialogButton';
import styles from './camping.module.css';
import cardStyles from './model-reviews.module.css';

export async function ModelProductReviews({ productId, showProviderLogo = true, hideEmpty = false, appearance = 'default' }: { productId: string; showProviderLogo?: boolean; hideEmpty?: boolean; appearance?: 'default' | 'card' }) {
  await io();
  const data = await getJudgeMePreview(productId);
  if (!data) return <p className={styles.reviewStatus}>Omtalene er ikke tilgjengelige akkurat nå.</p>;
  if (!data.count && hideEmpty) return null;
  if (!data.count) return <p className={styles.reviewStatus}>Ingen publiserte omtaler ennå.</p>;
  const average = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 }).format(data.average);
  return <InfoDialogButton title="Kundeomtaler" className={`${styles.reviewTrigger} ${appearance === 'card' ? cardStyles.trigger : ''}`} trigger={<>
      {appearance === 'card' ? <>
        <span className={cardStyles.stars} aria-hidden="true"><span>★★★★★</span><span className={cardStyles.fill} style={{ width: `${Math.max(0, Math.min(5, data.average)) / 5 * 100}%` }}>★★★★★</span></span>
        <span className={cardStyles.count} aria-hidden="true">{average} ({data.count})</span>
        <span className="sr-only">{average} av 5 fra {data.count} {data.count === 1 ? 'omtale' : 'omtaler'}. Vis omtaler.</span>
      </> : <span><span aria-hidden="true" className={styles.stars}>★</span> {average} av 5 <span className={styles.reviewCount}>({data.count})</span><span className="sr-only"> {data.count === 1 ? 'omtale' : 'omtaler'}. Vis omtaler.</span></span>}
      {showProviderLogo && <Image src="/logo-judgme.svg" alt="Judge.me" width={1187} height={224} className={styles.reviewLogo} />}
    </>}>
    <div className={styles.reviews}>
    {!showProviderLogo && <Image src="/logo-judgme.svg" alt="Judge.me" width={1187} height={224} className={styles.reviewLogo} />}
    <p>{data.average.toLocaleString('nb-NO', { maximumFractionDigits: 2 })} av 5 fra {data.count} {data.count === 1 ? 'omtale' : 'omtaler'}. Viser {data.reviews.length}.</p>
    <ul>{data.reviews.map(review => <li key={review.id}>
      <p><strong>{review.author}</strong> · {review.rating} av 5{review.verified && ' · Verifisert kjøper'}</p>
      {review.title && <h4>{review.title}</h4>}
      <p className={styles.reviewBody}>{review.body}</p>
    </li>)}</ul></div>
  </InfoDialogButton>;
}
