import { getImageProps } from 'next/image'
import styles from '@/components/knowledge/knowledgeChrome.module.css'

export function BaseLayerHero() {
  const common = {
    alt: 'En person står på en snødekket fjellrygg en kald vintermorgen med åpen vinterjakke, slik at det varme ullundertøyet (innerlaget) er synlig. Det er frost i luften og lav sol over snølandskapet.',
    sizes: '(min-width: 1024px) 816px, (min-width: 832px) 752px, (min-width: 800px) calc(100vw - 80px), (min-width: 400px) 90vw, calc(100vw - 40px)',
    loading: 'eager' as const,
    fetchPriority: 'high' as const,
  }
  const { props: desktop } = getImageProps({
    ...common,
    src: '/images/kunnskap/Vandrer på snødekt fjellrygg.webp',
    width: 1672,
    height: 941,
  })
  const { props: mobile } = getImageProps({
    ...common,
    src: '/images/kunnskap/Enslig vandrer ved vinterfjorden.webp',
    width: 1122,
    height: 1402,
  })

  return (
    <div className={styles.figure}>
      <picture className={styles.figureFrame}>
        <source
          media='(min-width: 768px)'
          srcSet={desktop.srcSet}
          sizes={desktop.sizes}
          width={desktop.width}
          height={desktop.height}
        />
        {/* getImageProps supplies optimized sources without client-side image switching. */}
        <img {...mobile} alt={common.alt} className={styles.figureImage} />
      </picture>
    </div>
  )
}
