import Image from 'next/image'
import styles from './knowledgeChrome.module.css'

// Dimensions measured from the original files, not inferred from MDX aspect hints.
const originalDimensions: Record<string, { width: number; height: number }> = {
  '/images/kunnskap/hvorfor-blir-man-kald-16x9.jpg': { width: 1672, height: 941 },
  '/images/kunnskap/hvorfor-blir-man-kald-4x3.jpg': { width: 1448, height: 1086 },
  '/glidelas-struktur-mikro.jpg': { width: 1448, height: 1086 },
  '/fea-simulation-mesh-16_9.png': { width: 1672, height: 941 },
  '/fabrikkarbeider-revisjon_3_4.jpg': { width: 1086, height: 1448 },
}

type ArticleImageProps = {
  src: string
  alt: string
  caption?: string
  // Retained for source compatibility/editorial provenance; never crop to these hints.
  aspect?: '16/9' | '4/3' | '1/1'
  prompt: string
}

export function ArticleImage({ src, alt, caption }: ArticleImageProps) {
  const dimensions = originalDimensions[src]
  if (!dimensions) throw new Error(`Missing verified article image dimensions: ${src}`)
  return (
    <figure className={styles.figure}>
      <span className={styles.figureFrame}>
        <Image className={styles.figureImage} src={src} alt={alt} {...dimensions}
          sizes='(min-width: 52rem) 47rem, calc(100vw - 2.5rem)' />
      </span>
      {caption ? <figcaption className={styles.figcaption}>{caption}</figcaption> : null}
    </figure>
  )
}
