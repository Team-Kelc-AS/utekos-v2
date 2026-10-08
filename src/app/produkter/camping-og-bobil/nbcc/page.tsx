import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import Breadcrumbs from "@/components/Breadcrumbs";
import { googleSansFlex } from "@/lib/fonts";
import { NBCC_LOGIN_URL, NBCC_PARTNER_URL, NBCC_PATH, nbccFaqItems, nbccPage, nbccSizeGuides, nbccSteps, nbccUseCases } from "@/lib/nbcc/content";
import { heroImage, nbccLogo } from "@/lib/nbcc/products";
import { nbccStructuredData } from "@/lib/nbcc/structuredData";
import { absoluteUrl } from "@/lib/seo/site";
import NbccProductSection from "./NbccProductSection";
import styles from "./nbcc.module.css";

export const metadata: Metadata = {
  title: nbccPage.title,
  description: nbccPage.description,
  alternates: { canonical: absoluteUrl(NBCC_PATH) },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website", locale: "nb_NO", siteName: "Utekos", url: absoluteUrl(NBCC_PATH),
    title: nbccPage.heading, description: nbccPage.description,
    images: [{ url: "/og-utekos-nbcc-1200x630.jpg", width: 1200, height: 630, alt: nbccPage.heading }],
  },
  twitter: { card: "summary_large_image", title: nbccPage.heading, description: nbccPage.description, images: ["/og-utekos-nbcc-1200x630.jpg"] },
};

export default function NbccPage() {
  return (
    <main className={`${googleSansFlex.variable} ${styles.page}`} data-nbcc-page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(nbccStructuredData()).replace(/</g, "\\u003c") }} />
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Breadcrumbs items={[
            { label: "Forsiden", href: "/" },
            { label: "Produkter", href: "/produkter" },
            { label: "Camping og bobil", href: "/produkter/camping-og-bobil" },
            { label: "NBCC-medlemsfordel" },
          ]} />
        </div>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.partner}>
              <Image src={nbccLogo} alt="Norsk Bobil og Caravan Club" sizes="80px" />
              <span>Medlemsfordel · Utekos og NBCC</span>
            </div>
            <h1>{nbccPage.heading}</h1>
            <p>{nbccPage.intro}</p>
            <div className={styles.actions}>
              <a className={styles.primary} href="#produkter">Finn din favoritt</a>
              <a className={styles.secondary} href="#slik-bruker-du-fordelen">Slik bruker du fordelen</a>
            </div>
          </div>
          <Image src={heroImage} alt="Campingfølge samlet rundt et bord utenfor en campingvogn" className={styles.heroImage} sizes="(max-width: 767px) calc(100vw - 3rem), 580px" preload />
        </header>
      </div>

      <div id="produkter" className={`${styles.container} ${styles.products}`}>
        <Suspense fallback={<div className={styles.section}><h2 id="nbcc-produkter">Utekos-plagg for NBCC-medlemmer</h2><p role="status">Laster produktvarianter …</p></div>}><NbccProductSection /></Suspense>
      </div>

      <div className={styles.container}>
        <section className={styles.section} aria-labelledby="medlemsfordel">
          <div className={styles.sectionIntro}>
            <h2 id="medlemsfordel">En varm fordel for de lange utekveldene</h2>
            <p>Utekos designer plagg for de gangene du vil bli sittende ute og nyte campinglivet litt til. Ved bobilen, i forteltet og på fastplassen er varme og komfort en del av de gode stundene sammen.</p>
            <p>NBCC samler folk rundt gleden ved camping og fellesskap. Samarbeidet med Utekos gir deg en medlemsfordel du kan ta med på neste tur.</p>
            <a href={NBCC_PARTNER_URL} className="underline">Les NBCCs omtale av samarbeidet og medlemsfordelen</a>
          </div>
        </section>
      </div>

      <section className={`${styles.section} ${styles.surface}`} aria-labelledby="campinglivet">
        <div className={styles.container}>
          <div className={styles.sectionIntro}><h2 id="campinglivet">Varme til pausene i campinglivet</h2><p>Fra morgenkaffe til kveldsamling. Finn et plagg til de stundene du vil være ute.</p></div>
          <div className={styles.grid}>{nbccUseCases.map((item) => <div key={item.title} className={styles.useCase}><h3>{item.title}</h3><p>{item.description}</p></div>)}</div>
        </div>
      </section>

      <div className={styles.container}>
        <section id="slik-bruker-du-fordelen" className={styles.section} aria-labelledby="slik-heading">
          <div className={styles.sectionIntro}><h2 id="slik-heading">Hvordan bruker jeg NBCC-fordelen?</h2><p>Hent medlemskoden hos NBCC og bruk den i rabattfeltet når du bestiller hos Utekos.</p><a href={NBCC_LOGIN_URL} className={styles.primary}>Hent medlemskoden på Min Side</a></div>
          <ol className={styles.steps}>{nbccSteps.map((step) => <li key={step.title}><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol>
          <Accordion><AccordionItem value="lokalavdeling" className={styles.details}><AccordionTrigger>Støtt din lokalavdeling</AccordionTrigger><AccordionContent><p>Har din lokalavdeling en egen avtale med Utekos, anbefaler NBCC at du bruker avdelingens rabattkode. Prisen for deg er den samme, samtidig som kjøpet støtter det lokale fellesskapet. Spør lokalavdelingen din hvis du er usikker.</p></AccordionContent></AccordionItem></Accordion>
        </section>

        <section id="storrelser" className={styles.section} aria-labelledby="storrelser-heading">
          <div className={styles.sectionIntro}><h2 id="storrelser-heading">Hvilken størrelse skal jeg velge?</h2><p>Se på plaggets mål, klærne du vil ha under og ønsket passform. Målene er ulike fra modell til modell.</p></div>
          <Accordion>{nbccSizeGuides.map((guide) => <AccordionItem key={guide.title} value={guide.title} className={styles.details}><AccordionTrigger>{guide.title}</AccordionTrigger><AccordionContent><p>{guide.intro}</p><div className={styles.tableWrap} role="region" aria-label={`Størrelsestabell for ${guide.title}`} tabIndex={0}><table className={styles.table}><caption>Mål for {guide.title}</caption><thead><tr><th scope="col">Mål</th>{guide.columns.map((name) => <th key={name} scope="col">{name}</th>)}</tr></thead><tbody>{guide.rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody></table></div></AccordionContent></AccordionItem>)}</Accordion>
        </section>

        <section id="sporsmal-og-svar" className={styles.section} aria-labelledby="faq-heading">
          <div className={styles.sectionIntro}><h2 id="faq-heading">Spørsmål om NBCC-medlemsfordelen</h2></div>
          <Accordion>{nbccFaqItems.map((item) => <AccordionItem key={item.question} value={item.question} className={styles.details}><AccordionTrigger>{item.question}</AccordionTrigger><AccordionContent><p>{item.answer}</p></AccordionContent></AccordionItem>)}</Accordion>
        </section>
      </div>

      <section className={`${styles.section} ${styles.surface}`} aria-labelledby="neste-tur">
        <div className={styles.container}>
          <div className={styles.sectionIntro}><h2 id="neste-tur">Ta med varmen til plassen der praten fortsetter</h2><p>Velg et plagg til morgenkaffen, turen over campingplassen eller kvelden i forteltet. Sammenlign modellene, finn størrelsen din og ha medlemskoden klar før du bestiller.</p></div>
          <div className={styles.actions}><a href="#produkter" className={styles.primary}>Se NBCC-utvalget</a><Link href="/produkter/camping-og-bobil" prefetch={false} className={styles.secondary}>Se hele campingutvalget</Link></div>
          <nav aria-label="Mer til campingturen" className={styles.related}><Link href="/uteguiden/hvordan-holde-varmen-ute" prefetch={false}>Slik holder du varmen ute</Link><Link href="/produkter/varmeplagg" prefetch={false}>Alle varmeplagg</Link></nav>
        </div>
      </section>
    </main>
  );
}
