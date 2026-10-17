import type { SocialImage } from './siteMetadata';

// Operator-supplied original files. Match product AND color; never reuse a
// similarly named color image across product families or resize the source.
export const productSocialImages: Readonly<Record<string, Readonly<Record<string, SocialImage>>>> = {
  'utekos-mikrofiber': {
    vargnatt: {
      url: '/images/kunnskap/og-utekos-vargnatt.webp',
      width: 1200, height: 630, type: 'image/webp',
      alt: 'Utekos Mikrofiber™ Vargnatt vist i tre situasjoner, ved hytta og ute i vinterlandskap.',
    },
    fjellbla: {
      url: '/images/kunnskap/og-utekos-fjellbla-blue-bg.webp',
      width: 1200, height: 630, type: 'image/webp',
      alt: 'Utekos Mikrofiber™ Fjellblå vist i tre situasjoner, ved hytta og ute i vinterlandskap.',
    },
  },
  'utekos-dun': {
    fjellbla: {
      url: '/images/kunnskap/og-utekos-fjellbla-night-bg.webp',
      width: 1200, height: 630, type: 'image/webp',
      alt: 'Utekos Dun™ Fjellblå vist i tre situasjoner, ved hytta og ute i vinterlandskap.',
    },
  },
};
