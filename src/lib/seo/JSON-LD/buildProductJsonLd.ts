import 'server-only';
import type { BreadcrumbList, Graph, Offer, Product, ProductGroup, Review, WithContext } from 'schema-dts';
import type { ShopifyProduct, ProductVariant } from '@/lib/shopify/product-types';
import type { JudgeMeReviews } from '@/lib/products/judgeme';
import { productTitle } from '@/lib/catalog/productTitle';
import { getProductPageDescriptionText } from '@/lib/products/content';
import { productGallery } from '@/lib/products/gallery';
import { productAvailability } from '@/lib/products/availability';
import { productBreadcrumbs } from '@/lib/seo/productBreadcrumbs';
import { absoluteUrl, productPath } from '@/lib/seo/site';
import { SITE_ORGANIZATION_ID } from '@/lib/seo/siteIdentity';
import { serializeJsonLd } from './serializeJsonLd';
import { productOfferPolicies } from './productPolicies';
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

function offerFor(handle: string, variant: ProductVariant, url: string): OfferNode | undefined {
  const price = Number(variant.price.amount);
  if (!/^\d+(?:\.\d+)?$/.test(variant.price.amount) || !Number.isFinite(price) || price < 0 || !/^[A-Z]{3}$/.test(variant.price.currencyCode)) return undefined;
  const compare = variant.compareAtPrice;
  return {
    '@type': 'Offer', url, price: variant.price.amount, priceCurrency: variant.price.currencyCode,
    availability: productAvailability(variant).schema,
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': SITE_ORGANIZATION_ID },
    ...(compare && /^\d+(?:\.\d+)?$/.test(compare.amount) && Number.isFinite(Number(compare.amount)) && compare.currencyCode === variant.price.currencyCode && Number(compare.amount) > price && {
      priceSpecification: { '@type': 'UnitPriceSpecification', priceType: 'https://schema.org/StrikethroughPrice', price: compare.amount, priceCurrency: compare.currencyCode },
    }),
    ...productOfferPolicies(handle, variant.price),
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
    const offers = offerFor(product.handle, variant, url);
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

/** One page graph: existing product identity plus the exact visible breadcrumb trail. */
export function buildProductPageJsonLd(product: ShopifyProduct, reviews: JudgeMeReviews | null): Graph | null {
  const productNode = buildProductJsonLd(product, reviews);
  if (!productNode) return null;
  const breadcrumb: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(productPath(product.handle))}#breadcrumb`,
    itemListElement: productBreadcrumbs(product).map((crumb, index) => ({
      '@type': 'ListItem', position: index + 1, name: crumb.label,
      ...(crumb.href && { item: absoluteUrl(crumb.href) }),
    })),
  };
  // Keep @context only at the graph root; entity IDs and relationships are unchanged.
  const { '@context': context, ...entity } = productNode;
  return { '@context': context, '@graph': [entity, breadcrumb] };
}

export function serializeProductJsonLd(data: WithContext<Product | ProductGroup> | Graph): string {
  return serializeJsonLd(data);
}
