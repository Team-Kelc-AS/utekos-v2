import type { MetadataRoute } from "next";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { assertProductHandles, categorySlugs, listingPath } from "@/lib/catalog/categories";
import { absoluteUrl, productPath } from "@/lib/seo/site";
import { supportPages } from "@/lib/seo/supportPages";
import { getProductHandles } from "@/lib/shopify/getProductHandles";
import { getProductListing } from "@/lib/shopify/getProductListing";
import { knowledgeArticleList, knowledgeOverview } from "@/lib/knowledge/knowledgeArticles";
import { NBCC_PATH } from "@/lib/nbcc/content";
import { heroImage as nbccHeroImage, nbccProducts } from "@/lib/nbcc/products";
import { getProduct } from "@/lib/shopify/getProduct";
import { editorialSitemapImages, productSitemapImages, sitemapImages } from "@/lib/seo/sitemapImages";
import { encodeSitemapEntry } from "@/lib/seo/sitemapXml";
import { homeSitemapVideos, getProductSitemapVideos } from "@/lib/seo/videoMedia";
import { retailers, retailerPath } from "@/lib/retailers";
import desktopHeroImage from "../../public/TechDown_32.jpg";
import tabletHeroImage from "../../public/Hero-iPad.webp";
import mobileHeroImage from "../../public/TechDown_1.webp";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("minutes");
  cacheTag("shopify:products", "shopify:collections");

  const [handles, listings] = await Promise.all([
    getProductHandles(),
    Promise.all(categorySlugs.map((slug) => getProductListing(slug, 1))),
  ]);
  assertProductHandles(handles);
  const products = await Promise.all(handles.map(getProduct));

  const paths = [
    ...(handles.length > 0 ? ["/produkter"] : []),
    ...categorySlugs.filter((_, index) => listings[index].products.length > 0).map((slug) => listingPath(slug)),
  ];

  const editorialEntry = (path: string): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path),
    ...(editorialSitemapImages[path] && { images: sitemapImages(editorialSitemapImages[path]) }),
  });

  // Keep real editorial timestamps; migration/build time is not an article update.
  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      images: sitemapImages([
        desktopHeroImage.src, tabletHeroImage.src, mobileHeroImage.src,
        ...editorialSitemapImages["/"],
      ]),
      videos: homeSitemapVideos,
    },
    { url: absoluteUrl(supportPages.contact.path) },
    { url: absoluteUrl("/forhandlere"), images: sitemapImages(retailers.map((retailer) => retailer.image.src)) },
    { url: absoluteUrl("/bli-forhandler") },
    ...retailers.map((retailer) => ({ url: absoluteUrl(retailerPath(retailer)), images: sitemapImages([retailer.image.src]) })),
    { url: absoluteUrl(supportPages.shippingReturns.path), lastModified: supportPages.shippingReturns.dateModified },
    { url: absoluteUrl(supportPages.maintenance.path), lastModified: supportPages.maintenance.article.dateModified },
    { url: absoluteUrl(supportPages.sizeGuide.path) },
    editorialEntry(supportPages.about.path),
    { url: absoluteUrl("/personvern") },
    { url: absoluteUrl("/vilkar-betingelser") },
    {
      url: absoluteUrl(NBCC_PATH),
      images: sitemapImages([
        nbccHeroImage.src,
        ...nbccProducts.flatMap((product) => product.images.map((image) => image.src.src)),
      ]),
    },
    ...paths.map((path) => ({ url: absoluteUrl(path) })),
    ...products.filter((product) => product !== null).map((product) => ({
      url: absoluteUrl(productPath(product.handle)),
      images: productSitemapImages(product),
      videos: getProductSitemapVideos(product),
    })),
    editorialEntry(knowledgeOverview.path),
    ...knowledgeArticleList.map((article) => ({
      ...editorialEntry(article.path),
      ...(article.updatedAt && { lastModified: article.updatedAt }),
    })),
  ];

  return entries.map(encodeSitemapEntry);
}
