import type { ProductPageHandle } from '@/lib/products/content';

// Hand-written product summaries shown when the AI summary cannot be generated.
// Keep each to the same scope as the AI summary: one or two factual sentences.
const PRODUCT_SUMMARY_FALLBACKS = {
  'utekos-techdown':
    'Utekos TechDown™ er et modulært 3-i-1-komfortplagg med beskyttende Luméa™-skall og fukttolerant CloudWeave™-isolasjon. Du justerer passform og ventilasjon etter behov, enten du er på hytten, på bobiltur eller på terrassen.',
  'utekos-mikrofiber':
    'Utekos Mikrofiber™ er vår letteste signaturmodell. Fiberisolasjonen tørker raskt og varmer selv i fuktig vær, og det flammehemmende ytterstoffet tåler bruk rundt bålpannen.',
  'utekos-dun':
    'Utekos Dun™ er det opprinnelige Utekos-ikonet. Nøye utvalgt andedun, justerbar passform og regulerbar ventilasjon gir varm og fleksibel komfort på hytten, i båten, i bobilen og på terrassen.',
  comfyrobe:
    'Comfyrobe™ er en myk og romslig unisex-jakke med SherpaCore-innside og vanntett, vindtett HydroGuard™-ytterstoff. Den gir pålitelig varme gjennom alle fire årstider.',
  'utekos-stapper':
    'Utekos Stapper™ reduserer volumet på soveposer, jakker og klær med over 50 %, slik at du får plass til mer i sekken eller bagasjen. Materialet tåler hard stramming og røff behandling på tur.',
} as const satisfies Record<ProductPageHandle, string>;

const GENERIC_PRODUCT_SUMMARY_FALLBACK =
  'Produktbeskrivelsen og detaljene på denne siden viser materialer, passform og bruksområder.';

export function getProductSummaryFallback(slug: string): string {
  return (
    PRODUCT_SUMMARY_FALLBACKS[slug as ProductPageHandle] ??
    GENERIC_PRODUCT_SUMMARY_FALLBACK
  );
}
