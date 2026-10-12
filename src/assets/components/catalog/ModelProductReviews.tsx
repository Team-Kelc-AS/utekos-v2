import 'server-only';
import Image from 'next/image';
import { io } from 'next/dist/server/request/io';
import { getJudgeMePreview } from '@/lib/products/judgeme';
import { InfoDialogButton } from './InfoDialogButton';
import styles from './camping.module.css';

export async function ModelProductReviews({ productId }: { productId: string }) {
  await io();
  const data = await getJudgeMePreview(productId);
  if (!data) return <p className={styles.reviewStatus}>Omtalene er ikke tilgjengelige akkurat nå.</p>;
  if (!data.count) return <p className={styles.reviewStatus}>Ingen publiserte omtaler ennå.</p>;
  return <InfoDialogButton title="Kundeomtaler" className={styles.reviewTrigger} trigger={<>
      <span><span aria-hidden="true" className={styles.stars}>★</span> {new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 }).format(data.average)} av 5 <span className={styles.reviewCount}>({data.count})</span><span className="sr-only"> {data.count === 1 ? 'omtale' : 'omtaler'}. Vis omtaler.</span></span>
      <Image src="/logo-judgme.svg" alt="Judge.me" width={1187} height={224} className={styles.reviewLogo} />
    </>}>
    <div className={styles.reviews}><p>{data.average.toLocaleString('nb-NO', { maximumFractionDigits: 2 })} av 5 fra {data.count} {data.count === 1 ? 'omtale' : 'omtaler'}. Viser {data.reviews.length}.</p>
    <ul>{data.reviews.map(review => <li key={review.id}>
      <p><strong>{review.author}</strong> · {review.rating} av 5{review.verified && ' · Verifisert kjøper'}</p>
      {review.title && <h4>{review.title}</h4>}
      <p className={styles.reviewBody}>{review.body}</p>
    </li>)}</ul></div>
  </InfoDialogButton>;
}
