import type { Metadata } from 'next';
import Link from 'next/link';
import { KlarnaIdentityButton } from '@/components/klarna/KlarnaIdentityButton';

export const metadata: Metadata = {
  title: 'Klarna-innlogging | Utekos',
  robots: { index: false, follow: false },
};

export default function KlarnaAccountPage() {
  return <main className="min-h-[60vh] bg-[#001a18] px-6 py-16 text-[#f0eee9]">
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-extrabold">Fortsett med Klarna</h1>
      <p className="font-medium">Koble Klarna til Utekos for å fylle inn e-postadressen din raskere når du går til kassen.</p>
      <KlarnaIdentityButton />
      <p className="text-sm">Klarna-innloggingen gir deg en Utekos-sesjon. Ordrehistorikk og kundekonto hos Shopify åpnes fortsatt via <Link href="/customer/account/authorize" className="underline underline-offset-4">kundekontoen</Link>.</p>
      <Link href="/personvern" className="inline-block text-sm underline underline-offset-4">Slik bruker vi opplysningene</Link>
    </div>
  </main>;
}
