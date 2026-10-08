import 'server-only';

import Image from 'next/image';
import { io } from 'next/cache';
import { getJudgeMeReviews } from '@/lib/products/judgeme';
import styles from './ProductReviews.module.css';

const dateFormat = new Intl.DateTimeFormat('nb-NO', { dateStyle: 'long', timeZone: 'Europe/Oslo' });

function Stars({ rating }: { rating: number }) {
  return <span className={styles.stars} aria-hidden="true"><span>★★★★★</span><span className={`${styles.filledStars} bg-primary`} style={{ width: `${rating / 5 * 100}%` }}>★★★★★</span></span>;
}

export async function ProductReviews({ productId }: { productId: string }) {
  // Optional reviews can fall back to a seconds cache; resolve that at request
  // time, outside Next 16.3.8's final prerender cache-warming pass.
  await io();
  const data = await getJudgeMeReviews(productId);
  if (!data || data.count === 0) return null;

  return (
    <section className={styles.panel} aria-label="Vurdering fra Judge.me">
      <div className={styles.overview}>
        <div>
          <Stars rating={data.average} />
          <p className={styles.rating}><strong>{data.average.toLocaleString('nb-NO', { maximumFractionDigits: 2 })} av 5</strong> · {data.count} {data.count === 1 ? 'kundeomtale' : 'kundeomtaler'}</p>
        </div>
        <Image src="/logo-judgme.svg" alt="Judge.me" width={1187} height={224} className={styles.logo} />
      </div>
    </section>
  );
}

export async function ProductReviewList({ productId }: { productId: string }) {
  await io();
  const data = await getJudgeMeReviews(productId);
  if (!data || data.reviews.length === 0) return null;
  return (
    <section className={`${styles.panel} ${styles.reviewPanel}`} aria-label="Kundeomtaler fra Judge.me" data-journey-section="reviews">
          <h2 className={styles.heading}>Kundeomtaler</h2>
          {data.reviews.length < data.count && <p className={styles.partial}>Viser {data.reviews.length} av {data.count} omtaler.</p>}
          <ul className={styles.list} tabIndex={0} aria-label="Les kundeomtalene">
            {data.reviews.map(review => (
              <li key={review.id} className={styles.review}>
                <div className={styles.reviewHeader}>
                  <strong>{review.author}</strong>
                  <span className={styles.reviewRating}><Stars rating={review.rating} /><span className="sr-only">{review.rating} av 5 stjerner</span></span>
                </div>
                <div className={styles.meta}>
                  {review.verified && <span>Bekreftet kjøp</span>}
                  {review.date && <time dateTime={review.date}>{dateFormat.format(new Date(review.date))}</time>}
                </div>
                {review.title && <h3 className={styles.title}>{review.title}</h3>}
                {review.body && <p className={styles.body}>{review.body}</p>}
              </li>
            ))}
          </ul>
    </section>
  );
}
