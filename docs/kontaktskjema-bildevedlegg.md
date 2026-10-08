# Bildevedlegg i kontaktskjemaet

Implementert lokalt 6. oktober 2026 på `/kontaktskjema`.

- Bruker eksisterende shadcn Attachment med Field og Input fra prosjektets Base Nova-registry. Valgte bilder vises med filnavn, størrelse og fjern-knapp. Ingen bildebeskjæring eller endring av originalfilen.
- Tillater opptil tre JPG-, PNG- eller WebP-bilder, maksimalt 4 000 000 bytes samlet. Filtype, antall og størrelse kontrolleres både i nettleseren og på serveren. Serveren kontrollerer også filsignaturen mot MIME-typen og normaliserer filnavnet.
- Native multipart FormData går til eksisterende Server Action. Valgte filer beholdes i klienten ved feil og synkroniseres tilbake til filfeltet før ny innsending. Uten JavaScript fungerer det native filfeltet og servervalideringen.
- Originalbytes sendes som base64-vedlegg gjennom eksisterende Resend-integrasjon. Vedleggene inngår i eksisterende idempotensnøkkel. Ingen separat fillagring eller offentlig bilde-URL opprettes.
- Next.js-grensen er 4.25 MiB, med plass til tekst og multipart-metadata over bildegrensen. Dette ligger under Vercels dokumenterte grense på 4.5 MB for forespørsler.
- Kontaktinformasjonen og FAQ-en er oppdatert til å beskrive bildevedlegg i skjemaet.

## Verifisering

`pnpm exec tsc --noEmit`, målrettet ESLint, `node --test tests/*.test.cjs` (60 tester) og `pnpm run build` passerer. Bygget har den eksisterende advarselen om manglende fallback-metrikk for Google Sans Flex.

Nettleserkontroll på 390 px og 1440 px: shadcn Attachment-kort, opplasting av flere bilder, fjerning, avvisning av for mange bilder og feil filtype, ingen horisontal sideoverflow, fokus på første ugyldige felt, og beholdte filer etter servervalideringsfeil. En syntetisk 1.5 MB testfil ble sendt til lokal servervalidering med ugyldige kontaktfelt og beholdt for ny innsending. Ingen e-post ble sendt under nettlesertesten.

Leverandørkallet er kontrollert med simulert Resend-svar, inkludert uendrede bytes, filnavn, MIME-type, idempotens, tekstmeldinger uten vedlegg og avvisning av ugyldige filer før leverandørkontakt. Faktisk mottak i e-postinnboksen og publisering er ikke verifisert eller utført.

## Kilder

- [shadcn Attachment](https://ui.shadcn.com/docs/components/base/attachment), [Field](https://ui.shadcn.com/docs/components/base/field) og [Input](https://ui.shadcn.com/docs/components/base/input).
- [shadcn endringslogg](https://ui.shadcn.com/docs/changelog): nye registry-komponenter bruker `cn`, som allerede er installert i prosjektet.
- Next.js 16.3.8: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md` og `node_modules/next/dist/docs/01-app/02-guides/forms.md`.
- [Resend Send Email](https://resend.com/docs/api-reference/emails/send-email), også kontrollert via Context7.
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations).
