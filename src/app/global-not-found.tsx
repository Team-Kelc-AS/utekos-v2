import "./globals.css";
import Image from "next/image";
import type { Metadata } from "next";
import { Suspense } from "react";
import { googleSansFlex } from "@/lib/fonts";
import { StapeScripts } from "@/lib/tracking/StapeScripts";
import { Tracking } from "@/lib/tracking/Tracking";
import { Telemetry } from "@/lib/tracking/Telemetry";

export const metadata: Metadata = {
  title: "Siden finnes ikke | Utekos",
  description: "Finn Utekos-produktene eller kontakt oss for hjelp.",
  robots: { index: false, follow: true },
};

// This is a separate document for unmatched URLs, outside the normal app shell.
// Recovery links deliberately perform full navigations into the regular layout.
/* eslint-disable @next/next/no-html-link-for-pages */
export default function GlobalNotFound() {
  return (
    <html lang="nb" className={`${googleSansFlex.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#001a18] text-[#f0eee9]">
        <StapeScripts />
        <Suspense fallback={null}><Tracking /><Telemetry /></Suspense>
        <header className="mx-auto max-w-5xl px-6 py-8">
          <a href="/" aria-label="Utekos – til forsiden" className="inline-flex min-h-11 items-center">
            <Image src="/WordmarkWhite.svg" alt="" width={1280} height={311} className="h-auto w-40" priority />
          </a>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-12 sm:py-20">
          <p className="mb-4 font-medium">404</p>
          <h1 className="text-3xl font-extrabold sm:text-5xl">Denne siden finnes ikke</h1>
          <p className="mt-6 max-w-xl text-lg font-medium">Lenken kan være utdatert eller adressen feil. Du finner alle Utekos-produktene i produktoversikten.</p>
          <nav aria-label="Finn veien videre" className="mt-8 flex flex-wrap gap-4">
            <a href="/produkter" className="inline-flex min-h-12 items-center rounded-full bg-[#b44701] px-6 py-3 font-medium">Se alle produkter</a>
            <a href="/kontaktskjema" className="inline-flex min-h-12 items-center px-4 py-3 font-medium underline underline-offset-4">Kontakt oss</a>
          </nav>
        </main>
      </body>
    </html>
  );
}
/* eslint-enable @next/next/no-html-link-for-pages */
