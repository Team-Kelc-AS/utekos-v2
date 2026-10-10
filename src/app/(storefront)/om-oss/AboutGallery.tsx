import Image from 'next/image'
import { CaretLeftIcon } from '@/components/utekos-icons/CaretLeftIcon'
import { CaretRightIcon } from '@/components/utekos-icons/CaretRightIcon'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import styles from './about.module.css'

const images = [
  { src: '/glimt-1.webp', width: 1440, height: 1800, alt: 'Mann i et svart Utekos-plagg med oransje detaljer på en snødekt terrasse i solnedgangen' },
  { src: '/glimt-2.webp', width: 1440, height: 1800, alt: 'Kvinne i et mørkeblått Utekos-plagg med hetten oppe i skogen' },
  { src: '/glimt-3.webp', width: 1440, height: 1800, alt: 'To personer i mørke Utekos-plagg med kaffekopper i en hengekøye i skogen' },
  { src: '/glimt-4.webp', width: 1440, height: 1800, alt: 'Kvinne i et blått Utekos-plagg på en snødekt stein med fjell i bakgrunnen' },
  { src: '/glimt-5.webp', width: 1122, height: 1402, alt: 'Kvinne i et mørkeblått Utekos-plagg ved et vann om høsten' },
  { src: '/glimt-6.webp', width: 1440, height: 1800, alt: 'Kvinne i et blått Utekos-plagg på hytteterrassen ved solnedgang' },
] as const

export function AboutGallery() {
  return (
    <Carousel
      aria-label="Livet med Utekos"
      aria-roledescription="bildekarusell"
      opts={{ align: 'start', loop: true }}
      className={styles.gallery}
    >
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem
            key={image.src}
            aria-label={`${index + 1} av ${images.length}`}
            aria-roledescription="bilde"
            className={styles.gallerySlide}
          >
            <Image
              {...image}
              alt={image.alt}
              sizes="(max-width: 767px) calc(100vw - 3rem), (max-width: 1023px) calc((100vw - 4rem) / 2), (max-width: 1264px) calc((100vw - 6rem) / 4), 292px"
              className={styles.galleryImage}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Forrige bilde" className={styles.galleryPrevious}>
        <CaretLeftIcon tone="light" />
      </CarouselPrevious>
      <CarouselNext aria-label="Neste bilde" className={styles.galleryNext}>
        <CaretRightIcon tone="light" />
      </CarouselNext>
    </Carousel>
  )
}
