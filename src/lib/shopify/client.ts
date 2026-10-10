import 'server-only';

const STOREFRONT_API_VERSION = '2026-10';
const STOREFRONT_TIMEOUT_MS = 10_000;

function requiredEnv(name: string, fallbackName?: string): string {
  const value =
    process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getEndpoint(): string {
  const domain = requiredEnv('SHOPIFY_STORE_DOMAIN')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  return `https://${domain}/api/${STOREFRONT_API_VERSION}/graphql.json`;
}

type GraphQLError = {
  message: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

type ShopifyFetchOptions<TVariables> = {
  query: string;
  variables?: TVariables;
  buyerIp?: string;
  signal?: AbortSignal;
  cache?: RequestCache;
};

export async function shopifyFetch<
  TData,
  TVariables extends Record<string, unknown> = Record<string, never>,
>({
  query,
  variables,
  buyerIp,
  signal,
  cache,
}: ShopifyFetchOptions<TVariables>): Promise<TData> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Shopify-Storefront-Private-Token': requiredEnv(
      'SHOPIFY_STOREFRONT_PRIVATE_TOKEN',
      'STOREFRONT_PRIVATE_ACCESS_TOKEN',
    ),
  });

  if (buyerIp) {
    headers.set('Shopify-Storefront-Buyer-IP', buyerIp);
  }

  const response = await fetch(getEndpoint(), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
    ...(cache ? { cache } : {}),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(STOREFRONT_TIMEOUT_MS)])
      : AbortSignal.timeout(STOREFRONT_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Shopify Storefront API ${response.status}: ${response.statusText}`,
    );
  }

  const result = (await response.json()) as GraphQLResponse<TData>;

  if (result.errors?.length) {
    throw new Error(
      `Shopify GraphQL: ${result.errors
        .map(({ message }) => message)
        .join('; ')}`,
    );
  }

  if (result.data === undefined) {
    throw new Error('Shopify Storefront API returned no data');
  }

  return result.data;
}
