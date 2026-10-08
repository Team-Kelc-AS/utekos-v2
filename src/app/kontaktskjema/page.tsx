import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import Breadcrumbs from "@/components/Breadcrumbs";
import { googleSansFlex } from "@/lib/fonts";
import { getContactEmailConfig } from "@/lib/contact";
import { CONTACT_ATTACHMENT_HINT } from "@/lib/contact-attachments";
import ContactForm from "./ContactForm";
import styles from "./contact.module.css";

const description = "Kontakt Utekos kundeservice for hjelp med bestilling, retur, reklamasjon eller valg av varmeplagg. Bruk kontaktskjemaet, send e-post eller ring oss.";

export const metadata: Metadata = {
  title: "Kontakt oss – kundeservice og produktveiledning",
  description,
  alternates: { canonical: "/kontaktskjema" },
  openGraph: {
    title: "Kontakt Utekos – kundeservice og produktveiledning",
    description, url: "/kontaktskjema", locale: "nb_NO", type: "website", siteName: "Utekos",
  },
};

function ContactFormSection() {
  if (!getContactEmailConfig()) {
    return <p role="status">Kontaktskjemaet er midlertidig utilgjengelig. Send henvendelsen til <a href="mailto:kundeservice@utekos.no">kundeservice@utekos.no</a>, eller ring <a href="tel:+4740216343">40 21 63 43</a>.</p>;
  }
  return <ContactForm />;
}

export default function ContactPage() {
  return (
    <main className={`${googleSansFlex.variable} ${styles.page}`}>
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Breadcrumbs items={[{ label: "Forsiden", href: "/" }, { label: "Kontakt oss" }]} />
        </div>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Kundeservice</p>
          <h1>Kontakt Utekos</h1>
          <p className={styles.intro}>Lurer du på hvilket varmeplagg som passer deg, eller trenger du hjelp med en bestilling? Fortell oss hva det gjelder, så hjelper vi deg videre.</p>
        </header>

        <div className={styles.layout}>
          <section aria-labelledby="contact-form-heading" className={styles.formPanel}>
            <h2 id="contact-form-heading">Send oss en melding</h2>
            <p className={styles.formIntro}>Navn, e-post og melding er påkrevd. Ordrenummer hjelper oss å finne bestillingen din.</p>
            <ContactFormSection />
          </section>

          <aside aria-labelledby="contact-details-heading" className={styles.sidebar}>
            <section className={styles.directContact}>
              <h2 id="contact-details-heading">Ta kontakt direkte</h2>
              <dl className={styles.contactDetails}>
                <div><dt>E-post</dt><dd><a href="mailto:kundeservice@utekos.no">kundeservice@utekos.no</a></dd></div>
                <div><dt>Telefon</dt><dd><a href="tel:+4740216343">+47 40 21 63 43</a></dd></div>
              </dl>
              <p className={styles.company}>Utekos drives av KELC AS.<br />Organisasjonsnummer: 925 820 393.</p>
            </section>
            <section className={styles.help}>
              <h2>Hjelp oss å hjelpe deg</h2>
              <h3>Bestilling, retur eller reklamasjon</h3>
              <p>Oppgi gjerne ordrenummer og e-postadressen du brukte ved kjøpet. Beskriv hva du trenger hjelp med. Har du bilder å vise oss, kan du legge dem ved i skjemaet.</p>
              <h3>Finn et varmeplagg som passer</h3>
              <p>Fortell om du skal bruke plagget på camping, på hytta eller hjemme på terrassen, og hva du ønsker hjelp til å velge.</p>
              <Link href="/produkter" prefetch={false}>Se varmeplagg og tilbehør</Link>
              <Link href="/uteguiden" prefetch={false}>Les råd og inspirasjon i Uteguiden</Link>
            </section>
          </aside>
        </div>

        <section className={styles.faq} aria-labelledby="contact-faq-heading">
          <h2 id="contact-faq-heading">Vanlige spørsmål til kundeservice</h2>
          <Accordion>
            <AccordionItem value="faq-1">
              <AccordionTrigger>Hvordan får jeg hjelp med bestillingen min?</AccordionTrigger>
              <AccordionContent>
                <p>Bruk kontaktskjemaet, send e-post til <a href="mailto:kundeservice@utekos.no">kundeservice@utekos.no</a> eller ring <a href="tel:+4740216343">40 21 63 43</a>. Ta gjerne med ordrenummeret fra ordrebekreftelsen og forklar hva henvendelsen gjelder.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2">
              <AccordionTrigger>Hva gjør jeg hvis jeg ønsker retur eller vil reklamere?</AccordionTrigger>
              <AccordionContent>
                <p>Kontakt oss med ordrenummer og en beskrivelse av saken. Ved feil på et produkt kan du legge ved bilder i skjemaet, slik at vi kan se hva det gjelder og hjelpe deg med veien videre.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3">
              <AccordionTrigger>Kan dere hjelpe meg å velge riktig Utekos-produkt?</AccordionTrigger>
              <AccordionContent>
                <p>Ja. Fortell hvor du vil bruke plagget, hvilken årstid det gjelder og om du har spørsmål om modell eller størrelse. Du kan også <Link href="/produkter/varmeplagg" prefetch={false}>se utvalget av varmeplagg</Link> før du kontakter oss.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-4">
              <AccordionTrigger>Kan jeg sende bilder eller vedlegg i skjemaet?</AccordionTrigger>
              <AccordionContent>
                <p>Ja, du kan legge ved bilder direkte i skjemaet. {CONTACT_ATTACHMENT_HINT} Oppgi gjerne ordrenummer hvis bildene gjelder en bestilling.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </main>
  );
}
