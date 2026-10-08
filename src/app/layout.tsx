import "./globals.css";
import { Suspense } from "react";
import { StapeScripts } from "@/lib/tracking/StapeScripts";
import { Tracking } from "@/lib/tracking/Tracking";
import { Telemetry } from "@/lib/tracking/Telemetry";

import Footer from "@/components/Footer";
import { googleSansFlex } from "@/lib/fonts";
import Header from "@/components/header/Header";
import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: "Utekos", template: "%s | Utekos" },
  description: "Nettbutikk",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="no"
      className={`${googleSansFlex.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StapeScripts />
        <Suspense fallback={null}><Tracking /><Telemetry /></Suspense>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
