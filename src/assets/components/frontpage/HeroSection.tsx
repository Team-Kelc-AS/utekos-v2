import "server-only";

import frontPageImage from "../../../../public/images/products/Comfyrobe_1080x1920_4.webp";
import comfyrobePortraitImage from "../../../../public/corporate/brand/img/Comfyrobe1534x2000.webp";
import { getImageProps } from "next/image";
import { googleSansFlex } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const tabletMedia = "(min-width: 640px) and (pointer: coarse), (min-width: 640px) and (max-width: 1023px)";
const desktopMedia = "(min-width: 1024px) and (pointer: fine), (min-width: 1024px) and (pointer: none)";
const heroAlt = "Comfyrobe™ i Fjellnatt, vist forfra og bakfra. Førpris 1690 kr, nå 845 kr. Gjelder frem til 31. oktober.";

function HeroImage() {
  const { props } = getImageProps({
    src: frontPageImage,
    alt: heroAlt,
    sizes: "100vw",
    loading: "eager",
    fetchPriority: "high",
    unoptimized: true,
  });
  const { props: portrait } = getImageProps({
    src: comfyrobePortraitImage,
    alt: heroAlt,
    sizes: "100vw",
    loading: "eager",
    fetchPriority: "high",
  });

  return (
    <>
      <link rel="preload" as="image" media={desktopMedia} href={props.src} fetchPriority="high" />
      <link rel="preload" as="image" media="(max-width: 639px)" imageSrcSet={portrait.srcSet} imageSizes={portrait.sizes} fetchPriority="high" />
      <link rel="preload" as="image" media={tabletMedia} imageSrcSet={portrait.srcSet} imageSizes={portrait.sizes} fetchPriority="high" />
      <picture className="block w-full">
        <source media={desktopMedia} srcSet={props.src} width={props.width} height={props.height} />
        <img {...portrait} alt={heroAlt} className="block h-auto w-full" />
      </picture>
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
