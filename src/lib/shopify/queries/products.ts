const VARIANT_FIELDS = `
  id title availableForSale currentlyNotInStock quantityAvailable taxable sku barcode
  price { amount currencyCode }
  compareAtPrice { amount currencyCode }
  image { url altText width height }
  selectedOptions { name value }
`;

export const PRODUCT_VARIANTS_QUERY = `#graphql
  query ProductVariants($handle: String!, $after: String) {
    product(handle: $handle) {
      variants(first: 100, after: $after) {
        nodes { ${VARIANT_FIELDS} }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;
export const PRODUCT_IMAGES_QUERY = `#graphql
  query ProductImages($handle: String!, $after: String) {
    product(handle: $handle) {
      images(first: 100, after: $after) {
        nodes { url altText width height }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;
export const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      vendor productType
      collections(first: 100) { nodes { id title } pageInfo { hasNextPage endCursor } }
      description(truncateAt: 160)
      descriptionHtml
      seo { title description }
      options { name values }
      images(first: 100) {
        nodes { url altText width height }
        pageInfo { hasNextPage endCursor }
      }
      variants(first: 100) {
        nodes { ${VARIANT_FIELDS} }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
` as const;

export const PRODUCT_COLLECTIONS_QUERY = `#graphql
  query ProductCollections($handle: String!, $after: String!) {
    product(handle: $handle) {
      collections(first: 100, after: $after) { nodes { id title } pageInfo { hasNextPage endCursor } }
    }
  }
`;

export const PRODUCT_HANDLES_QUERY = `#graphql
  query ProductHandles($after: String) {
    products(first: 100, after: $after) {
      nodes {
        handle
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;
