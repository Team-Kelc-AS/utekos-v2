import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Din bestilling | Utekos',
  description: 'Informasjon og hjelp etter bestilling med Klarna.',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

// A return URL is not proof of payment. Do not emit Purchase, expose order data,
// or assert payment status from its query string. Shopify remains authoritative.
export default function KlarnaReturnPage() {
  return (
    <main className="flex-1 bg-[#001a18] px-6 py-16 text-[#f0eee9] sm:py-24">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 font-medium">Klarna</p>
        <h1 className="text-3xl font-extrabold sm:text-5xl">Din bestilling</h1>
        <p className="mt-6 text-lg font-medium">
          Se ordrebekreftelsen på e-post for detaljer om bestillingen, og Klarna for betalingsstatus.
        </p>
        <p className="mt-4 font-medium">
          Er du usikker på om bestillingen gikk gjennom? Kontakt oss før du prøver å betale på nytt, så hjelper vi deg å sjekke.
        </p>
        <nav aria-label="Etter bestillingen" className="mt-8 flex flex-wrap gap-4">
          <Link href="/kontaktskjema" prefetch={false} className="inline-flex min-h-12 items-center rounded-full bg-[#b44701] px-6 py-3 font-medium">Få hjelp med bestillingen</Link>
          <Link href="/produkter" prefetch={false} className="inline-flex min-h-12 items-center px-4 py-3 font-medium underline underline-offset-4">Se alle produkter</Link>
        </nav>
      </div>
    </main>
  );
}
