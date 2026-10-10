import { Suspense } from "react";
import type { Metadata } from "next";
import { buildHomeMetadata } from "@/lib/seo/siteMetadata";
import { HeroSection } from "@/components/frontpage/HeroSection";
import { HomeVideo } from "@/components/frontpage/HomeVideo";
import { HomeProducts, HomeProductsLoading } from "@/components/frontpage/HomeProducts";
import { SectionSocialProof } from "@/components/frontpage/SectionSocialProof";
import { TrustSection } from "@/components/frontpage/TrustSection";
import { PromiseSection } from "@/components/frontpage/PromiseSection";
import { IntersportSection } from "@/components/frontpage/IntersportSection";

export const metadata: Metadata = buildHomeMetadata();

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <Suspense fallback={<HomeProductsLoading />}>
        <HomeProducts />
      </Suspense>
      <HomeVideo />
      <TrustSection />
      <PromiseSection />
      <IntersportSection />
      <SectionSocialProof />
    </main>
  );
}
