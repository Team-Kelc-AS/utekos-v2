import 'server-only';
import { StockedProducts } from '@/components/ProductCard/StockedProducts';

export function RelatedProducts({ handle }: { handle: string }) {
  return <StockedProducts
    title="Favoritter blant andre livsnytere"
    headingId="related-products"
    listId="related-products"
    route={`/produkter/${handle}`}
    excludeProductHandle={handle}
  />;
}
