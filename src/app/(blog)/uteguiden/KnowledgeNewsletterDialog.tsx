'use client';

import Link from 'next/link';
import Dialog from '@/components/commerce/Dialog';
import NewsletterForm from '@/components/footer/NewsletterForm';

export default function KnowledgeNewsletterDialog({ onClose }: { onClose: () => void }) {
  return <Dialog title="Meld deg på Utekos sitt nyhetsbrev" onClose={onClose}>
    <p>Motta våre grundigste veiledere om uterom, bekledning og tekniske løsninger.</p>
    <p>Du får nyheter og tilbud på e-post og kan melde deg av når som helst. Les vår <Link href="/personvern">personvernerklæring</Link>.</p>
    <NewsletterForm />
  </Dialog>;
}
