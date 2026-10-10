import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Next 16.3.8: retain typed entry points while tree-shaking the ESM cache
  // implementation. Recheck cache scope and bundle output when upgrading Next.
  turbopack: {
    resolveAlias: {
      "next/dist/server/use-cache/cache-tag": "next/dist/esm/server/use-cache/cache-tag.js",
      "next/dist/server/use-cache/cache-life": "next/dist/esm/server/use-cache/cache-life.js",
    },
  },
  reactCompiler: true,
  partialPrefetching: true,
  // Resolve route/variant validation before sending headers, so invalid URLs
  // return HTTP 404 instead of a streamed 200 containing a not-found screen.
  htmlLimitedBots: /.*/,
  // 4 MB of contact images, with room for form fields and multipart headers.
  experimental: { serverActions: { bodySizeLimit: "4.25mb" } },
  images: { remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/1/0634/2154/6744/**" }] },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  async redirects() {
    return [
      { source: "/contact", destination: "/kontaktskjema", permanent: true },
      { source: "/pages/contact", destination: "/kontaktskjema", permanent: true },
      { source: "/pages/kundeservice", destination: "/kontaktskjema", permanent: true },
      { source: "/nbcc", destination: "/produkter/camping-og-bobil/nbcc", permanent: true },
      { source: "/kunnskap", destination: "/uteguiden", permanent: true },
      { source: "/kunnskap/:path*", destination: "/uteguiden/:path*", permanent: true },
    ];
  },
};

const withMDX = createMDX({
  // Serializable plugin names are required by Turbopack. TOC links need heading IDs.
  options: { remarkPlugins: ["remark-gfm"], rehypePlugins: ["rehype-slug"] },
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
