import Image from 'next/image'
import { KnowledgeSignupButton } from './KnowledgeSignupButton'
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
      <KnowledgeSignupButton className={styles.signupButton} />
    </aside>
  )
}
