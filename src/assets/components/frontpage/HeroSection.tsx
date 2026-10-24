import "server-only";

import frontPageImage from "../../../../public/images/products/Comfyrobe_1080x1920_4.webp";
import mobileImage from "../../../../public/corporate/brand/img/Dun4.webp";
import tabletImage from "../../../../public/corporate/brand/img/FjellblaDunVerticalIpad3.webp";
import tabletVargnattImage from "../../../../public/corporate/brand/img/DunVargnattVerticalIpad2.webp";
import { HeroDissolve } from "./HeroDissolve";
import { getImageProps } from "next/image";
import { googleSansFlex } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const tabletMedia = "(min-width: 640px) and (pointer: coarse), (min-width: 640px) and (max-width: 1023px)";
const desktopMedia = "(min-width: 1024px) and (pointer: fine), (min-width: 1024px) and (pointer: none)";

function HeroImage() {
  const { props } = getImageProps({
    src: frontPageImage,
    alt: "Comfyrobe™ i Fjellnatt, vist forfra og bakfra. Førpris 1690 kr, nå 845 kr. Gjelder frem til 31. oktober.",
    sizes: "100vw",
    loading: "eager",
    fetchPriority: "high",
    unoptimized: true,
  });
  const imageOptions = { alt: "Varmeplagg fra Utekos.", sizes: "100vw", loading: "eager", fetchPriority: "high" } as const;
  const { props: mobile } = getImageProps({ ...imageOptions, src: mobileImage });
  const { props: tablet } = getImageProps({ ...imageOptions, src: tabletImage });
  const { props: tabletVargnatt } = getImageProps({ ...imageOptions, src: tabletVargnattImage, loading: "lazy", fetchPriority: "low" });

  return (
    <>
      <link rel="preload" as="image" media={desktopMedia} href={props.src} fetchPriority="high" />
      <link rel="preload" as="image" media="(max-width: 639px)" imageSrcSet={mobile.srcSet} imageSizes={mobile.sizes} fetchPriority="high" />
      <link rel="preload" as="image" media={tabletMedia} imageSrcSet={tablet.srcSet} imageSizes={tablet.sizes} fetchPriority="high" />
      <HeroDissolve mediaQuery="(min-width: 640px) and (pointer: coarse) and (prefers-reduced-motion: no-preference), (min-width: 640px) and (max-width: 1023px) and (prefers-reduced-motion: no-preference)">
        <div data-hero-front className="group-data-[state=ready]/dissolve:opacity-(--hero-front-opacity)">
          <picture className="block w-full">
            <source media={tabletMedia} srcSet={tablet.srcSet} sizes={tablet.sizes} width={tablet.width} height={tablet.height} />
            <source media="(min-width: 1024px)" srcSet={props.src} width={props.width} height={props.height} />
            <img {...mobile} alt="Varmeplagg fra Utekos Dun™ og Comfyrobe™." className="block h-auto w-full" />
          </picture>
        </div>
        <picture data-hero-back className="absolute top-0 left-0 hidden w-full opacity-0 sm:block group-data-[state=ready]/dissolve:opacity-(--hero-back-opacity)">
          <source media={tabletMedia} data-hero-srcset={tabletVargnatt.srcSet} sizes={tabletVargnatt.sizes} width={tabletVargnatt.width} height={tabletVargnatt.height} />
          <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="Utekos Dun™ Vargnatt med oransje fôr, vist forfra og bakfra." width={tabletVargnatt.width} height={tabletVargnatt.height} className="block h-auto w-full" />
        </picture>
      </HeroDissolve>
    </>
  );
}

// Pure content is automatically prerendered with cacheComponents enabled.
export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-h1"
      data-journey-section="hero"
      data-tracking-route="/"
      data-tracking-promotion="home-hero"
      data-tracking-creative="Skreddersy varmen"
      data-tracking-slot="hero"
      className={cn(
        googleSansFlex.variable,
        "isolate w-full bg-background font-sans font-medium text-foreground [--background:#001a18] [--foreground:#f0eee9] [--primary:#b44701] [font-optical-sizing:none] [font-variation-settings:'opsz'_120]",
      )}
    >
      <HeroImage />
      <div className="flex flex-col items-center bg-jungle px-4 py-12 text-center sm:gap-8 sm:px-0 sm:py-14 lg:py-16">
        <h1
          id="hero-h1"
          className="m-0 max-w-3xl text-4xl/[1.15] font-extrabold text-balance sm:text-5xl/[1.15] lg:text-6xl/[1.15]"
        >
          Skreddersy varmen
        </h1>
        <p className="m-0 hidden text-xl/[1.4] text-balance sm:block md:text-3xl/[1.4]">
          Opplev kompromissløs komfort og overlegen allsidighet.
        </p>
      </div>
    </section>
  );
}
