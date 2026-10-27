import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  typedRoutes: true,
  cacheComponents: true,
  turbopack: {
    resolveAlias: {
      "next/dist/server/use-cache/cache-tag":
        "next/dist/esm/server/use-cache/cache-tag.js",
      "next/dist/server/use-cache/cache-life":
        "next/dist/esm/server/use-cache/cache-life.js",
    },
  },
  reactCompiler: true,
  partialPrefetching: true,
  // Resolve route/variant validation before sending headers, so invalid URLs
  // return HTTP 404 instead of a streamed 200 containing a not-found screen.
  htmlLimitedBots: /.*/,
  experimental: {
    // Unmatched URLs must use one complete 404 document, rather than replaying
    // the partially prerendered app shell against Next's fallback route tree.
    globalNotFound: true,
    // 4 MB of contact images, with room for form fields and multipart headers.
    serverActions: { bodySizeLimit: "4.25mb" },
    cssChunking: "graph",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/1/0634/2154/6744/**",
      },
    ],
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "feed\\.utekos\\.no" }],
          destination: "https://backend.utekos.no/klarna-feed.xml",
        },
      ],
      afterFiles: ["/klarna-feed.xml", "/api/feeds/microsoft-merchant"].map(
        (source) => ({
          source,
          destination: `https://backend.utekos.no${source}`,
        }),
      ),
    };
  },
  async redirects() {
    return [
      {
        source: "/gaveguide",
        destination: "/handlehjelp/klarna",
        permanent: true,
      },
      {
        source: "/skreddersy-varmen",
        destination: "/produkter/utekos-techdown",
        permanent: true,
      },
      {
        source: "/produkter/techdown",
        destination: "/produkter/utekos-techdown",
        permanent: true,
      },
      { source: "/contact", destination: "/kontaktskjema", permanent: true },
      {
        source: "/pages/contact",
        destination: "/kontaktskjema",
        permanent: true,
      },
      {
        source: "/pages/kundeservice",
        destination: "/kontaktskjema",
        permanent: true,
      },
      {
        source: "/nbcc",
        destination: "/produkter/camping-og-bobil/nbcc",
        permanent: true,
      },
      { source: "/kunnskap", destination: "/uteguiden", permanent: true },
      {
        source: "/kunnskap/:path*",
        destination: "/uteguiden/:path*",
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX({
  options: { remarkPlugins: ["remark-gfm"], rehypePlugins: ["rehype-slug"] },
});

export default withMDX(nextConfig);
