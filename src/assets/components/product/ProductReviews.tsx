import 'server-only';

import Image from 'next/image';
import { io } from 'next/dist/server/request/io';
import { getJudgeMeReviews, getJudgeMeStoreReviews, type JudgeMeReview } from '@/lib/products/judgeme';
import styles from './ProductReviews.module.css';

const dateFormat = new Intl.DateTimeFormat('nb-NO', { dateStyle: 'long', timeZone: 'Europe/Oslo' });

function Stars({ rating }: { rating: number }) {
  return <span className={styles.stars} aria-hidden="true"><span>★★★★★</span><span className={`${styles.filledStars} bg-primary`} style={{ width: `${rating / 5 * 100}%` }}>★★★★★</span></span>;
}

function ReviewItems({ reviews, verifiedLabel }: { reviews: JudgeMeReview[]; verifiedLabel: string }) {
  return reviews.map(review => (
    <li key={review.id} className={styles.review}>
      <div className={styles.reviewHeader}>
        <strong>{review.author}</strong>
        <span className={styles.reviewRating}><Stars rating={review.rating} /><span className="sr-only">{review.rating} av 5 stjerner</span></span>
      </div>
      <div className={styles.meta}>
        {review.verified && <span>{verifiedLabel}</span>}
        {review.date && <time dateTime={review.date}>{dateFormat.format(new Date(review.date))}</time>}
      </div>
      {review.title && <h3 className={styles.title}>{review.title}</h3>}
      {review.body && <p className={styles.body}>{review.body}</p>}
    </li>
  ));
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
            <ReviewItems reviews={data.reviews} verifiedLabel="Bekreftet kjøp" />
          </ul>
    </section>
  );
}

export async function StoreReviewSummary() {
  await io();
  const data = await getJudgeMeStoreReviews();
  if (!data || data.reviews.length === 0) return null;
  const average = data.reviews.length === data.count
    ? data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.count
    : null;
  const formattedAverage = average?.toLocaleString('nb-NO', { maximumFractionDigits: 1 });

  return (
    <section className={`${styles.panel} ${styles.storeSummary}`} aria-label="Kundeomtaler fra Judge.me">
      <div className={`${styles.overview} ${styles.storeOverview}`}>
        <div className={styles.storeSummaryLeft}>
          <a href="#kundeomtaler" className={styles.storeReviewLink}>Kundeomtaler</a>
          {average !== null && (
            <span className={styles.storeSummaryRating}>
              <Stars rating={average} />
              <span className={styles.storeAverage} aria-hidden="true">{formattedAverage}/5</span>
              <span className="sr-only">Gjennomsnitt {formattedAverage} av 5 stjerner basert på {data.count} kundeomtaler</span>
            </span>
          )}
        </div>
        <Image src="/logo-judgme.svg" alt="Judge.me" width={1187} height={224} className={styles.logo} />
      </div>
    </section>
  );
}

export async function StoreReviewList() {
  await io();
  const data = await getJudgeMeStoreReviews();
  if (!data || data.reviews.length === 0) return null;

  return (
    <section id="kundeomtaler" className={`${styles.panel} ${styles.reviewPanel}`} aria-label="Kundeomtaler om Utekos fra Judge.me" data-journey-section="reviews" data-review-scope="store">
      <h2 className={styles.heading}>Kundeomtaler</h2>
      {data.reviews.length < data.count && <p className={styles.partial}>Viser {data.reviews.length} av {data.count} omtaler.</p>}
      <ul className={styles.list} tabIndex={0} aria-label="Les kundeomtalene">
        <ReviewItems reviews={data.reviews} verifiedLabel="Bekreftet kunde" />
      </ul>
    </section>
  );
}
