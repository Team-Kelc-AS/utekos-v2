const VARIANT_FIELDS = `
  id title availableForSale currentlyNotInStock quantityAvailable taxable sku barcode
  price { amount currencyCode }
  compareAtPrice { amount currencyCode }
  image { url altText width height }
  selectedOptions { name value }
`;

export const PRODUCT_CARDS_QUERY = `#graphql
  query ProductCards($after: String) {
    products(first: 100, after: $after) {
      nodes {
        id handle title vendor productType
        collections(first: 100) { nodes { id title } pageInfo { hasNextPage endCursor } }
        variants(first: 100) {
          nodes { ${VARIANT_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const PRODUCT_CARD_VARIANTS_QUERY = `#graphql
  query ProductCardVariants($handle: String!, $after: String) {
    product(handle: $handle) {
      variants(first: 100, after: $after) {
        nodes { ${VARIANT_FIELDS} }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;
