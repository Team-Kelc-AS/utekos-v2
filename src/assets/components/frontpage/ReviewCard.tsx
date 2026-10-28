import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Review } from './data/reviews'
import { initialsFrom } from './utils/initialsFrom'
import { LocationIcon } from '@/components/utekos-icons'
import styles from './ReviewCard.module.css'

export function ReviewCard({ review }: { review: Review }) {
  return (
    <article
      data-tone={review.id % 3}
      className={cn(
        styles.card,
        'group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border p-6 transition-[transform,border-color,box-shadow] duration-300 md:p-7'
      )}
    >
      <header className='mb-5 flex items-center justify-between gap-3'>
        <div
          role='img'
          aria-label={`${review.rating} av 5 stjerner`}
          className='flex gap-0.5 text-review-star drop-shadow-sm'
        >
          {Array.from({ length: Math.round(review.rating) }).map(
            (_, i) => (
              <Star
                key={i}
                fill='currentColor'
                size={14}
                strokeWidth={0}
              />
            )
          )}
        </div>
        <span className={cn(styles.productTag, 'leading-text-paragraph inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-sans font-semibold text-[10px] tracking-[-0.01em] text-foreground')}>
          Utekos TechDown™
        </span>
      </header>

      {review.title && (
        <h3 className='mb-3 font-sans text-xl leading-[0.95] tracking-[-0.01em] text-foreground md:text-2xl'>
          &ldquo;{review.title}&rdquo;
        </h3>
      )}

      {/* foreground med litt transparens for behagelig lese-kontrast i brødteksten */}
      <p className='leading-text-paragraph mb-6 text-sm tracking-[-0.01em] text-foreground/85 md:text-base'>
        {review.quote}
      </p>

      <footer className='flex items-center gap-3 border-t border-foreground/10 pt-4'>
        <div
          aria-hidden
          className={cn(styles.avatar, 'flex size-10 shrink-0 items-center justify-center rounded-full border font-sans font-semibold text-sm text-foreground')}
        >
          {initialsFrom(review.name)}
        </div>
        <div className='min-w-0'>
          <p className='leading-text-paragraph truncate font-sans font-semibold text-sm tracking-[-0.01em] text-foreground'>
            {review.name}
          </p>
          {(review.role || review.location) && (
            <p className='leading-text-paragraph flex items-center gap-1.5 text-xs tracking-[-0.01em] text-foreground/50'>
              {review.role && (
                <>
                  <span className='truncate'>{review.role}</span>
                  {review.location && <span aria-hidden>·</span>}
                </>
              )}
              {review.location && (
                <>
                  <LocationIcon tone="orange" size={10} aria-hidden />
                  <span className='truncate'>
                    {review.location}
                  </span>
                </>
              )}
            </p>
          )}
        </div>
      </footer>
    </article>
  )
}
