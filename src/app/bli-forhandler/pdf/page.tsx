import type { Metadata } from "next";
import Link from "next/link";
import { googleSansFlex } from "@/lib/fonts";
import DealerPdfForm from "./DealerPdfForm";
import styles from "./pdf.module.css";

export const metadata: Metadata = {
  title: "Forhandlerinformasjon – fyll ut og send",
  description: "Les forhandlerinformasjonen, fyll ut skjemaet og send henvendelsen til Utekos.",
  alternates: { canonical: "/bli-forhandler" },
  robots: { index: false, follow: true },
};

export default function DealerPdfPage() {
  return <main className={`${googleSansFlex.variable} ${styles.page}`}>
    <Link href="/bli-forhandler">Tilbake til Bli forhandler</Link>
    <h1>Forhandlerinformasjon og skjema</h1>
    <p>Fyll ut feltene på side 7 og trykk «Send henvendelsen». Opplysningene og den utfylte PDF-en sendes automatisk til Erling Holthe.</p>
    <DealerPdfForm />
    <noscript><p><Link href="/bli-forhandler#forhandlerskjema">Bruk det vanlige skjemaet for å sende henvendelsen.</Link></p></noscript>
  </main>;
}
