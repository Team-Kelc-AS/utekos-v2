import type { Metadata } from 'next';
import { Suspense } from 'react';
import { safeGoogleReturnTo } from '@/lib/customer-auth/google';

export const metadata: Metadata = { title: 'Google-innlogging', robots: { index: false, follow: false } };

const messages: Record<string, string> = {
  cancelled: 'Google-innloggingen ble avbrutt. Du kan prøve igjen når du er klar.',
  expired: 'Innloggingsforsøket er utløpt. Start på nytt for å fortsette.',
  verification: 'Vi kunne ikke bekrefte Google-kontoen. Prøv igjen.',
};

type AuthErrorProps = { searchParams: Promise<{ reason?: string | string[]; returnTo?: string | string[] }> };

export default function GoogleAuthError(props: AuthErrorProps) {
  return <main className="flex min-h-[65svh] items-center justify-center bg-[#001a18] px-5 py-16 text-[#f0eee9]">
    <section className="w-full max-w-md rounded-3xl border border-[#f0eee92b] bg-[#012622] p-7 sm:p-9">
      <h1 className="text-3xl font-extrabold">Google-innlogging</h1>
      <Suspense fallback={<p role="status" className="mt-5 text-lg">Laster innlogging …</p>}>
        <AuthErrorDetails {...props} />
      </Suspense>
    </section>
  </main>;
}

async function AuthErrorDetails({ searchParams }: AuthErrorProps) {
  const query = await searchParams;
  const returnTo = safeGoogleReturnTo(query.returnTo);
  const message = typeof query.reason === 'string' ? messages[query.reason] : undefined;
  return <>
      <p role="alert" className="mt-5 text-lg leading-relaxed">{message ?? 'Google-innlogging er midlertidig utilgjengelig. Du kan prøve igjen eller bruke e-post fra ønskelisten.'}</p>
      <a href={`/auth/google?${new URLSearchParams({ returnTo })}`} className="mt-7 flex min-h-12 items-center justify-center rounded-xl bg-[#b44701] px-5 font-medium">Prøv Google igjen</a>
      <a href={returnTo} className="mt-4 flex min-h-12 items-center justify-center rounded-xl border border-[#f0eee94d] px-5">Tilbake til nettbutikken</a>
  </>;
}
