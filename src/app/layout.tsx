import "./globals.css";
import { Suspense } from "react";
import { StapeScripts } from "@/lib/tracking/StapeScripts";
import { Tracking } from "@/lib/tracking/Tracking";
import { Telemetry } from "@/lib/tracking/Telemetry";

import Footer from "@/components/Footer";
import { googleSansFlex } from "@/lib/fonts";
import Header from "@/components/header/Header";
import type { Metadata } from "next";
import { buildRootMetadata } from "@/lib/seo/siteMetadata";
import { buildSiteJsonLd } from "@/lib/seo/JSON-LD/buildSiteJsonLd";
import { serializeJsonLd } from "@/lib/seo/JSON-LD/serializeJsonLd";

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nb"
      className={`${googleSansFlex.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script id="site-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildSiteJsonLd()) }} />
        <StapeScripts />
        <Suspense fallback={null}><Tracking /><Telemetry /></Suspense>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
