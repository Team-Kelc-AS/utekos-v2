import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      {
        userAgent: ["Googlebot", "Googlebot-Image", "Googlebot-Video", "Googlebot-News", "Storebot-Google", "Google-InspectionTool", "GoogleOther", "GoogleOther-Image", "GoogleOther-Video", "Google-CloudVertexBot", "Google-Extended", "AdsBot-Google", "AdsBot-Google-Mobile", "Mediapartners-Google", "APIs-Google"],
        allow: "/",
      },
      {
        userAgent: ["facebookexternalhit", "meta-externalads", "meta-webindexer", "meta-externalagent", "meta-externalfetcher"],
        allow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
