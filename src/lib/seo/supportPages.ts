export type SupportPageKey = 'about' | 'contact' | 'sizeGuide' | 'maintenance' | 'shippingReturns';

type SupportPage = {
  path: string;
  title: string;
  description: string;
  pageType: 'AboutPage' | 'ContactPage' | 'WebPage';
  socialType: 'website' | 'article';
  breadcrumbs: readonly { label: string; href?: string }[];
  dateModified?: string;
  article?: { headline: string; section: string; dateModified: string };
};

/** Public content facts shared by metadata, visible breadcrumbs and page graphs. */
export const supportPages = {
  about: {
    path: '/om-oss',
    title: 'Om Utekos | Historien bak varmeplaggene',
    description: 'Les historien bak Utekos, møt grunnlegger Erling Holthe og bli kjent med varmeplaggene og løftet om flere gode øyeblikk ute.',
    pageType: 'AboutPage', socialType: 'website',
    breadcrumbs: [{ label: 'Forsiden', href: '/' }, { label: 'Om oss' }],
  },
  contact: {
    path: '/kontaktskjema',
    title: 'Kontakt Utekos | Kundeservice og produktveiledning',
    description: 'Kontakt Utekos kundeservice for hjelp med bestilling, retur, reklamasjon eller valg av varmeplagg. Bruk kontaktskjemaet, send e-post eller ring oss.',
    pageType: 'ContactPage', socialType: 'website',
    breadcrumbs: [{ label: 'Forsiden', href: '/' }, { label: 'Kontakt oss' }],
  },
  sizeGuide: {
    path: '/handlehjelp/storrelsesguide',
    title: 'Størrelsesguide for Utekos | Mål og passform',
    description: 'Se plaggmål og råd om passform for Utekos TechDown™, Utekos Dun™, Utekos Mikrofiber™ og Comfyrobe™. Finn riktig størrelse og les om størrelsesbytte.',
    pageType: 'WebPage', socialType: 'website',
    breadcrumbs: [{ label: 'Forsiden', href: '/' }, { label: 'Størrelsesguide' }],
  },
  maintenance: {
    path: '/handlehjelp/vask-og-vedlikehold',
    title: 'Vask og vedlikehold av Utekos | Pleie av varmeplagg',
    description: 'Slik vasker, tørker og oppbevarer du Utekos TechDown™, Utekos Dun™, Utekos Mikrofiber™ og Comfyrobe™. Følg alltid vaskelappen i plagget.',
    pageType: 'WebPage', socialType: 'article',
    breadcrumbs: [{ label: 'Forsiden', href: '/' }, { label: 'Vask og vedlikehold' }],
    article: {
      headline: 'Riktig pleie. Varme som varer.',
      section: 'Vask og vedlikehold',
      // Visible <time dateTime> in the guide; neither build time nor publication date.
      dateModified: '2026-09-01',
    },
  },
  shippingReturns: {
    path: '/frakt-og-retur',
    title: 'Frakt og retur hos Utekos | Levering og størrelsesbytte',
    description: 'Frakt og retur hos Utekos: se fraktpris, leveringstid, 14 dagers angrerett, gratis størrelsesbytte, returadresse og hvordan du får pengene tilbake.',
    pageType: 'WebPage', socialType: 'website',
    breadcrumbs: [{ label: 'Forsiden', href: '/' }, { label: 'Frakt og retur' }],
    // Visible <time dateTime> in the policy; not the build or publication date.
    dateModified: '2026-10-05',
  },
} as const satisfies Record<SupportPageKey, SupportPage>;

/** Named subjects only: the guides contain no product offers or live inventory. */
export const supportProductFamilies = [
  { name: 'Utekos TechDown™', path: '/produkter/utekos-techdown' },
  { name: 'Utekos Dun™', path: '/produkter/utekos-dun' },
  { name: 'Utekos Mikrofiber™', path: '/produkter/utekos-mikrofiber' },
  { name: 'Comfyrobe™', path: '/produkter/comfyrobe' },
] as const;
