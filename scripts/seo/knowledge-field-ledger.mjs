/** Regenerate the complete field inventory, including inherited schema-dts fields. */
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const file = require.resolve('schema-dts/dist/schema.d.ts');
const program = ts.createProgram([file], { skipLibCheck: true });
const checker = program.getTypeChecker();
const source = program.getSourceFile(file);
const used = {
  Article: '@type @id url headline description inLanguage mainEntityOfPage isPartOf author publisher image articleSection keywords isAccessibleForFree datePublished dateModified citation',
  WebPage: '@type @id url name description inLanguage isPartOf mainEntity breadcrumb primaryImageOfPage',
  CollectionPage: '@type @id url name description inLanguage isPartOf mainEntity breadcrumb',
  BreadcrumbList: '@type @id itemListElement',
  ListItem: '@type position name item url',
  ItemList: '@type @id numberOfItems itemListElement',
  OnlineStore: '@type @id name legalName url description logo identifier address email telephone contactPoint',
  WebSite: '@type @id url name inLanguage publisher',
  PostalAddress: '@type streetAddress postalCode addressLocality addressCountry',
  ContactPoint: '@type contactType url email telephone availableLanguage',
  PropertyValue: '@type propertyID value',
  ImageObject: '@type @id url contentUrl caption width height',
  QuantitativeValue: '@type value unitText',
  CreativeWork: '@type name description url',
};
const undocumented = new Set('accountablePerson acquireLicensePage award awards copyrightHolder copyrightNotice copyrightYear creator creditText dateCreated dateModified datePublished discussionUrl editor funder funding isBasedOn legalName legalAddress license locationCreated maintainer publishingPrinciples review reviewedBy sameAs sponsor temporalCoverage translator version foundingDate founder founders employee employees contactPoint contactPoints telephone email taxID vatID address duns leiCode iso6523Code globalLocationNumber knowsAbout knowsLanguage memberOf identifier logo correctionsPolicy ethicsPolicy diversityPolicy ownershipFundingInfo actionableFeedbackPolicy'.split(' '));
const googleFields = {
  Article: new Set('author dateModified datePublished headline image'.split(' ')),
  BreadcrumbList: new Set(['itemListElement']),
  ListItem: new Set('item name position'.split(' ')),
  OnlineStore: new Set('name url logo sameAs legalName description address contactPoint telephone email taxID vatID iso6523Code'.split(' ')),
  PostalAddress: new Set('streetAddress postalCode addressLocality addressCountry'.split(' ')),
  ContactPoint: new Set('contactType telephone email'.split(' ')),
  WebSite: new Set('name url alternateName'.split(' ')),
};
const rows = [];
for (const [type, selected] of Object.entries(used)) {
  const declaration = source.statements.find(node => node.name?.text === `${type}Leaf`);
  if (!declaration) throw new Error(`Missing schema type ${type}`);
  const implemented = new Set(selected.split(' '));
  for (const field of checker.getPropertiesOfType(checker.getTypeAtLocation(declaration))) {
    const name = field.name;
    const origin = field.declarations?.[0]?.parent?.name?.text ?? 'IdReference';
    let status = implemented.has(name) ? 'implementert' : undocumented.has(name) ? 'manglende dokumentasjon' : 'ikke relevant';
    let reason = status === 'implementert' ? 'Bygges fra det validerte registeret eller fast, dokumentert nettstedsidentitet.'
      : status === 'manglende dokumentasjon' ? 'Ikke publisert uten dokumentert verdi/rettighet/identitet; valgfritt felt.'
      : 'Utelatt: ingen rolle i denne avgrensede artikkel-, navigasjons- eller identitetsmodellen; ikke et krav om full Schema.org-utfylling.';
    if (type === 'Article' && ['datePublished', 'dateModified'].includes(name)) reason = 'Betinget: sju dokumenterte datoer beholdes ordrett. Tre udaterte artikler utelater feltet. Dato uten tid beholder presisjonen.';
    if (type === 'Article' && name === 'citation') reason = 'Eksisterende kilder, samme antall. Ingen citation for glamping-i-norge (ingen dokumentert kildeliste).';
    if (['OnlineStore', 'WebSite', 'PostalAddress', 'ContactPoint', 'PropertyValue'].includes(type) && status === 'implementert') reason = 'Felles identitet fra root layout. Utekos/KELC AS: BRREG 925820393 og synlig nettstedskontakt, kontrollert 2026-10-09. Sidene refererer til stabile @id-verdier.';
    if (type === 'OnlineStore' && name === 'foundingDate') reason = 'BRREG dokumenterer KELC AS sin stiftelse, ikke etableringsdatoen til merkevaren Utekos; utelatt i nettbutikkidentiteten.';
    if (type === 'OnlineStore' && name === 'image') {
      status = 'manglende dokumentasjon';
      reason = 'Logo leveres som logo; separat virksomhetsbilde er ikke valgt/dokumentert. Google Rich Results Test klassifiserer også OnlineStore under Local businesses og gir én ikke-kritisk merknad om valgfritt image. Ingen kritisk feil.';
    }
    if (type === 'CreativeWork' && name === 'name') reason = 'Kildetittel når den finnes. Opprinnelig glamping-kilde 22 har tom tittel; name utelates der.';
    if (type === 'CreativeWork' && name === 'url') reason = 'Hoved-URL og eksisterende additionalLinks, uten å oppfinne kildeadresser. Utelates ved manglende URL.';
    if (type === 'ListItem' && name === 'item') reason = 'Brødsmuler: absolutt canonical. Oversiktens liste bruker url i stedet.';
    if (type === 'ListItem' && name === 'url') reason = 'Oversikt: lenke til artikkel. Brødsmuler bruker item i stedet.';
    if (type === 'Article' && name === 'speakable') {
      status = 'ikke støttet av aktuell konsument';
      reason = 'Googles speakable-funksjon gjelder et avgrenset engelsk nyhets-/assistenttilfelle, ikke norske redaksjonelle nettbutikkguider.';
    }
    const consumer = googleFields[type]?.has(name)
      ? 'Dokumentert av Google for den aktuelle funksjonen; ListItem-felter gjelder BreadcrumbList, ikke en generell artikkelkarusell.'
      : name.startsWith('@') ? 'JSON-LD struktur/identitet.'
      : 'Schema.org-semantikk. Ikke dokumentert her som et Google Article-/Breadcrumb rich-result-felt; ingen visningsgaranti.';
    rows.push({ type, field: name, inheritedFrom: origin, status, reason, consumer, source: name.startsWith('@') ? 'https://www.w3.org/TR/json-ld11/' : `https://schema.org/${name}` });
  }
}
fs.mkdirSync('docs/seo', { recursive: true });
const columns = Object.keys(rows[0]);
const quote = value => `"${String(value).replaceAll('"', '""')}"`;
fs.writeFileSync('docs/seo/uteguiden-schema-fields.csv', [columns.join(','), ...rows.map(row => columns.map(c => quote(row[c])).join(','))].join('\n') + '\n');
console.log(`${rows.length} field/type decisions including inherited fields, schema-dts 2.1.0. docs/seo/uteguiden-schema-fields.csv`);
