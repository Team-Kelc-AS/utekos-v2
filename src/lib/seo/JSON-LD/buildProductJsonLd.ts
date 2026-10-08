import 'server-only';
import type { Offer, Product, ProductGroup, Review, WithContext } from 'schema-dts';
import type { ShopifyProduct, ProductVariant } from '@/lib/shopify/product-types';
import type { JudgeMeReviews } from '@/lib/products/judgeme';
import { productTitle } from '@/lib/catalog/productTitle';
import { getProductPageDescriptionText } from '@/lib/products/content';
import { productGallery } from '@/lib/products/gallery';
import { absoluteUrl, productPath } from '@/lib/seo/site';
import { utekosTechDown } from './techdown/UtekosTechDown';
import { utekosMikrofiber } from './mikrofiber/UtekosMikrofiber';
import { utekosDun } from './dun/UtekosDun';
import { utekosSvale } from './svale/UtekosSvale';
import { comfyrobe } from './comfyrobe/Comfyrobe';
import { stapper } from './stapper/Stapper';

type ProductNode = Extract<Product, { '@type': 'Product' }>;
type OfferNode = Extract<Offer, { '@type': 'Offer' }>;
type Definition = { product: ProductNode | ProductGroup; variants: ProductNode[] };
const definitions = new Map<string, Definition>([
  ['utekos-techdown', { product: utekosTechDown, variants: utekosTechDown.hasVariant }],
  ['utekos-mikrofiber', { product: utekosMikrofiber, variants: utekosMikrofiber.hasVariant }],
  ['utekos-dun', { product: utekosDun, variants: utekosDun.hasVariant }],
  ['utekos-svale', { product: utekosSvale, variants: utekosSvale.hasVariant }],
  ['comfyrobe', { product: comfyrobe, variants: comfyrobe.hasVariant }],
  ['utekos-stapper', { product: stapper, variants: [stapper] }],
]);

function option(variant: ProductVariant, names: string[]) {
  const value = variant.selectedOptions.find(o => names.includes(o.name.toLowerCase()))?.value.trim();
  return value && value !== 'Default Title' ? value : undefined;
}

/** Keep leading zeroes; omit invalid identifiers instead of inventing one. */
function gtinProperties(barcode: string | null): Pick<ProductNode, 'gtin8' | 'gtin12' | 'gtin13' | 'gtin14'> {
  const value = barcode?.trim();
  if (!value || !/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)) return {};
  const sum = [...value.slice(0, -1)].reverse().reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 1 : 3), 0);
  if ((10 - sum % 10) % 10 !== Number(value.slice(-1))) return {};
  return { [`gtin${value.length}`]: value };
}

function editorialProperties(source?: ProductNode | ProductGroup) {
  // Publish reviewed product facts, not the snapshots' historical prices/reviews
  // or the original TechDown draft's unverified importer/manufacturer/logo.
  return {
    ...(source?.material && { material: source.material }),
    ...(source?.category && { category: source.category }),
    ...(source?.audience && { audience: source.audience }),
    ...(source?.additionalProperty && { additionalProperty: source.additionalProperty }),
  };
}

function reviewProperties(data: JudgeMeReviews | null, canonical: string): Pick<ProductNode, 'aggregateRating' | 'review'> {
  if (!data || data.count <= 0 || data.average < 1 || data.average > 5) return {};
  const reviews: Review[] = data.reviews.map(review => ({
    '@type': 'Review', '@id': `${canonical}#review-${review.id}`,
    author: { '@type': 'Person', name: review.author },
    ...(review.title && { name: review.title }),
    ...(review.body && { reviewBody: review.body }),
    ...(review.date && { datePublished: review.date }),
    reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5, worstRating: 1 },
  }));
  return {
    aggregateRating: { '@type': 'AggregateRating', ratingValue: data.average, reviewCount: data.count, bestRating: 5, worstRating: 1 },
    ...(reviews.length > 0 && { review: reviews }),
  };
}

function offerFor(variant: ProductVariant, url: string, template?: ProductNode): OfferNode | undefined {
  const price = Number(variant.price.amount);
  if (!variant.price.amount.trim() || !Number.isFinite(price) || price < 0) return undefined;
  const stored = template?.offers;
  const policy = stored && !Array.isArray(stored) && typeof stored === 'object' && '@type' in stored && stored['@type'] === 'Offer' ? stored : undefined;
  const compare = variant.compareAtPrice;
  const shipping = policy?.shippingDetails;
  // Rate for one unit at its current price; /frakt-og-retur says free from 999 NOK.
  const shippingDetails = variant.price.currencyCode === 'NOK' && shipping && !Array.isArray(shipping) && typeof shipping === 'object' && '@type' in shipping && shipping['@type'] === 'OfferShippingDetails'
    ? { ...shipping, shippingRate: { '@type': 'MonetaryAmount' as const, value: price >= 999 ? 0 : 99, currency: 'NOK' } }
    : undefined;
  return {
    '@type': 'Offer', url, price: variant.price.amount, priceCurrency: variant.price.currencyCode,
    availability: !variant.availableForSale ? 'https://schema.org/OutOfStock' : variant.currentlyNotInStock ? 'https://schema.org/BackOrder' : 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'Utekos', legalName: 'KELC AS', url: absoluteUrl('/') },
    ...(compare && compare.currencyCode === variant.price.currencyCode && Number(compare.amount) > price && {
      priceSpecification: { '@type': 'UnitPriceSpecification', priceType: 'https://schema.org/StrikethroughPrice', price: compare.amount, priceCurrency: compare.currencyCode },
    }),
    ...(shippingDetails && { shippingDetails }),
    ...(policy?.hasMerchantReturnPolicy && { hasMerchantReturnPolicy: policy.hasMerchantReturnPolicy }),
  };
}

/**
 * One canonical ProductGroup with directly selectable variant URLs. Layouts
 * persist during query-string navigation, so include all current variants.
 * https://developers.google.com/search/docs/appearance/structured-data/product-variants
 */
export function buildProductJsonLd(product: ShopifyProduct, reviews: JudgeMeReviews | null): WithContext<Product | ProductGroup> | null {
  if (product.variants.nodes.length === 0) return null;
  const canonical = absoluteUrl(productPath(product.handle));
  const groupId = `${canonical}#product-group`;
  const definition = definitions.get(product.handle);
  const name = productTitle(product);
  const description = getProductPageDescriptionText(product.handle) || product.description;
  const shared = {
    name, description, brand: { '@type': 'Brand' as const, name: product.vendor },
    ...editorialProperties(definition?.product),
  };
  const variants: ProductNode[] = product.variants.nodes.map(variant => {
    const template = definition?.variants.find(item => item.productID === variant.id);
    const color = option(variant, ['farge', 'color']);
    const size = option(variant, ['størrelse', 'size', 'str']);
    const material = option(variant, ['material', 'materiale']);
    const pattern = option(variant, ['pattern', 'mønster']);
    const gender = option(variant, ['gender', 'kjønn']);
    const url = `${canonical}?variant=${variant.id.split('/').pop()}`;
    const gallery = productGallery(product, variant);
    const image = [...new Set([...gallery.desktop, ...gallery.mobile].map(item => absoluteUrl(item.url)))];
    const offers = offerFor(variant, url, template);
    const swatch = template?.color === color && typeof template?.colorSwatch === 'string' && /^https?:\/\//.test(template.colorSwatch) ? template.colorSwatch : undefined;
    return {
      '@type': 'Product', '@id': `${canonical}#variant-${variant.id.split('/').pop()}`,
      name: `${[name, color].filter(Boolean).join(' ')}${size ? `, ${size}` : ''}`,
      description, productID: variant.id, url,
      ...(variant.sku && { sku: variant.sku }),
      ...gtinProperties(variant.barcode),
      ...(image.length > 0 && { image }),
      ...(color && { color }), ...(swatch && { colorSwatch: swatch }), ...(size && { size }),
      ...(material && { material }), ...(pattern && { pattern }),
      ...(gender && { audience: { '@type': 'PeopleAudience', suggestedGender: gender.toLowerCase() } }),
      ...(template?.weight && { weight: template.weight }),
      ...(template?.hasMeasurement && { hasMeasurement: template.hasMeasurement }),
      ...(offers && { offers }),
    };
  });
  if (variants.length === 1) {
    return { '@context': 'https://schema.org', ...shared, ...variants[0], ...reviewProperties(reviews, canonical) };
  }
  const variesBy = [
    ['color', ['farge', 'color']], ['size', ['størrelse', 'size', 'str']],
    ['material', ['material', 'materiale']], ['pattern', ['pattern', 'mønster']],
    ['suggestedGender', ['gender', 'kjønn']],
  ] as const;
  return {
    '@context': 'https://schema.org', '@type': 'ProductGroup', '@id': groupId,
    ...shared, productGroupID: product.id.split('/').pop(), url: canonical,
    image: [...new Set(variants.flatMap(variant => Array.isArray(variant.image) ? variant.image : []))],
    variesBy: variesBy.filter(([, names]) => new Set(product.variants.nodes.map(variant => option(variant, [...names])).filter(Boolean)).size > 1).map(([property]) => `https://schema.org/${property}`),
    ...reviewProperties(reviews, canonical),
    hasVariant: variants.map(variant => ({ ...variant, isVariantOf: { '@id': groupId } })),
  };
}

export function serializeProductJsonLd(data: WithContext<Product | ProductGroup>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
