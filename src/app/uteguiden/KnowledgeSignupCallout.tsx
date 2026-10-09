import Image from 'next/image'
import styles from './knowledgeOverview.module.css'

export function KnowledgeSignupCallout() {
  return (
    <aside className={styles.signupCallout} aria-label='Veiledere fra Utekos'>
      <Image
        src='/IconWhite.svg'
        alt='Utekos'
        width={1280}
        height={1109}
        className={styles.signupLogo}
      />
      <p className={styles.signupCopy}>
        <strong>Gjør fakta til praktisk nytte.</strong>{' '}
        Motta våre grundigste veiledere om uterom, bekledning og tekniske løsninger.
      </p>
      {/* Enable when the newsletter destination is confirmed. */}
      <button className={styles.signupButton} type='button' disabled>
        Meld deg på
      </button>
    </aside>
  )
}
