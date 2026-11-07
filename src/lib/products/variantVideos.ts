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

// TechDown posters are unaltered frames extracted from the exact video files.
// Comfyrobe retains its current product image as the cover.
// The size-to-video mapping is shared with the existing product UI; titles
// describe the film rather than claiming it demonstrates a specific size.
const videos: Record<string, Partial<Record<string, ProductVideoSource>>> = {
  comfyrobe: {
    XL: {
      src: '/assets/videos/comfy-video-1.mp4',
      width: 1080,
      height: 1440,
      poster: '/images/products/comfyrobe/comfyrobe_mobile_2.webp',
      title: 'Comfyrobe™ – produktvideo',
      description: 'Produktvideo av Comfyrobe™.',
    },
  },
  'utekos-techdown': {
    Middels: video('b7ad5aa6e5b749e18f1b9c8a47180e5a', 'techdown-produkt', 'Utekos TechDown™ – produktfilm', 'Nærbilder av Utekos TechDown™ og plaggets detaljer.'),
    Stor: video('16f45a8826d04c18b41fc29e94212a5b', 'techdown-detaljer', 'Utekos TechDown™ – detaljer', 'Produktfilm med nærbilder av Utekos TechDown™ utendørs.'),
    Større: video('b7ad5aa6e5b749e18f1b9c8a47180e5a', 'techdown-produkt', 'Utekos TechDown™ – produktfilm', 'Nærbilder av Utekos TechDown™ og plaggets detaljer.'),
  },
};

export function productVariantVideo(handle: string, variant: Pick<ProductVariant, 'selectedOptions'> & Partial<Pick<ProductVariant, 'image'>>) {
  const size = variant.selectedOptions.find(option => ['Størrelse', 'Size', 'Str'].includes(option.name))?.value;
  const source = size ? videos[handle]?.[size] : undefined;
  return handle === 'comfyrobe' && source && variant.image ? { ...source, poster: variant.image.url } : source;
}
