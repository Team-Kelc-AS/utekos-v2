export const PRODUCT_LIST_QUERY = `#graphql
  query ProductList($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: ID) {
      nodes { handle title description(truncateAt: 180) }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const COLLECTION_LIST_QUERY = `#graphql
  query CollectionList($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      products(first: $first, after: $after) {
        nodes { handle title description(truncateAt: 180) }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

export const PRODUCT_SUMMARY_QUERY = `#graphql
  query ProductSummary($handle: String!) {
    product(handle: $handle) { handle title description(truncateAt: 180) }
  }
`;
