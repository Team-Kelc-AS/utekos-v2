import type { ProductVariant } from '@/lib/shopify/product-types';

export type ProductVideoSource = { src: string; width: number; height: number; poster: string; title: string; description: string };

const video = (id: string, poster: string, title: string, description: string): ProductVideoSource => ({
  src: `https://cdn.shopify.com/videos/c/o/v/${id}.mp4`,
  width: 1440,
  height: 1800,
  poster: `/videos/${poster}.jpg`,
  title,
  description,
});

// Posters are unaltered frames extracted from these exact video files.
// The size-to-video mapping is shared with the existing product UI; titles
// describe the film rather than claiming it demonstrates a specific size.
const videos: Record<string, Partial<Record<string, ProductVideoSource>>> = {
  'utekos-svale': {
    Middels: video('ad55c3a3299e4a4281def7afcac9caff', 'svale-detaljer', 'Utekos Svale – detaljer', 'Nærbilder av Utekos Svale under bruk utendørs.'),
    Stor: video('a3ccb83777684e6e8576a79088d69beb', 'svale-i-bruk', 'Utekos Svale – i bruk', 'Produktfilm med Utekos Svale og detaljer fra plagget i bruk utendørs.'),
    Større: video('edc5f94b8a434dd896f0282e9b92dc52', 'svale-i-hengekoye', 'Utekos Svale – i hengekøyen', 'Utekos Svale i bruk i en hengekøye utendørs.'),
  },
  'utekos-techdown': {
    Middels: video('b7ad5aa6e5b749e18f1b9c8a47180e5a', 'techdown-produkt', 'Utekos TechDown™ – produktfilm', 'Nærbilder av Utekos TechDown™ og plaggets detaljer.'),
    Stor: video('16f45a8826d04c18b41fc29e94212a5b', 'techdown-detaljer', 'Utekos TechDown™ – detaljer', 'Produktfilm med nærbilder av Utekos TechDown™ utendørs.'),
    Større: video('b7ad5aa6e5b749e18f1b9c8a47180e5a', 'techdown-produkt', 'Utekos TechDown™ – produktfilm', 'Nærbilder av Utekos TechDown™ og plaggets detaljer.'),
  },
};

export function productVariantVideo(handle: string, variant: Pick<ProductVariant, 'selectedOptions'>) {
  const size = variant.selectedOptions.find(option => ['Størrelse', 'Size', 'Str'].includes(option.name))?.value;
  return size ? videos[handle]?.[size] : undefined;
}
