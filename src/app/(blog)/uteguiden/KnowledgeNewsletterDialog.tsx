'use client';

import Link from 'next/link';
import Dialog from '@/components/commerce/Dialog';
import NewsletterForm from '@/components/footer/NewsletterForm';

export default function KnowledgeNewsletterDialog({ onClose }: { onClose: () => void }) {
  return <Dialog title="Meld deg på Utekos sitt nyhetsbrev" onClose={onClose}>
    <p>Få våre grundigste veiledere om uterom og bekledning, samt tidlig tilgang til tilbud og rabatter.</p>
    <NewsletterForm />
    <p>Les vår <Link href="/personvern" className="underline underline-offset-4">personvernerklæring</Link></p>
  </Dialog>;
}
