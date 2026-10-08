import Image from 'next/image'
import styles from './about.module.css'

export function AboutHero() {
  return (
    <header className={styles.hero}>
      <Image
        src="/om-oss.webp"
        alt=""
        width={1376}
        height={768}
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
        className={styles.heroImage}
      />
      <div className={styles.heroCopy}>
        <h1 aria-label="Om Utekos">
          <Image
            src="/WordmarkWhite.svg"
            alt="Utekos"
            width={1280}
            height={311.16}
            loading="eager"
            className={styles.heroWordmark}
          />
        </h1>
        <span className={`${styles.heroPill} bg-primary`}>Skreddersy varmen</span>
        <p className={styles.intro}>
          Drevet av kalde kvelder og et løfte om å aldri la været stoppe de gode øyeblikkene.
        </p>
      </div>
    </header>
  )
}
