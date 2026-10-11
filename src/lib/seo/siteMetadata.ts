import {
  SITE_DESCRIPTION,
  siteIdentity,
  siteSocialImage,
} from "./siteIdentity";

import type { Metadata } from "next";
import { SITE_ORIGIN } from "./site";

export function buildRobotsMetadata(
  index = true,
): Exclude<Metadata["robots"], string | null | undefined> {
  return {
    index: process.env.VERCEL_ENV !== "preview" && index,
    follow: true,
    "max-image-preview": "large",
  };
}

/** Share complete nested objects: Next.js replaces, rather than deep-merges, them. */
export function buildWebsiteSocialMetadata(
  title: string,
  description: string,
  url?: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      siteName: siteIdentity.name,
      locale: "nb_NO",
      title,
      description,
      images: [{ ...siteSocialImage }],
      ...(url && { url }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: siteSocialImage.url, alt: siteSocialImage.alt }],
    },
  };
}

export function buildRootMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: {
      default: siteIdentity.name,
      template: `%s | ${siteIdentity.name}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: siteIdentity.name,
    publisher: siteIdentity.name,
    icons: {
      icon: { url: siteIdentity.logo.src, type: "image/png" },
      apple: { url: siteIdentity.logo.src, type: "image/png" },
    },
    robots: buildRobotsMetadata(),
    openGraph: {
      type: "website",
      siteName: siteIdentity.name,
      locale: "nb_NO",
      images: [{ ...siteSocialImage }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export function buildHomeMetadata(): Metadata {
  const title = "Utekos | Skreddersy varmen";
  return {
    title: { absolute: title },
    description: SITE_DESCRIPTION,
    alternates: { canonical: siteIdentity.url },
    ...buildWebsiteSocialMetadata(title, SITE_DESCRIPTION, siteIdentity.url),
  };
}
