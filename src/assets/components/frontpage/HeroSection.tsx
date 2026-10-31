import "server-only";

import frontPageImage from "../../../../public/images/products/comfyrobe/tre-marine-comfyrobe-hero.webp";
import comfyrobeMobileImage from "../../../../public/corporate/brand/img/Comfyrobe_Mobile_Hero.webp";
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
  const { props: mobile } = getImageProps({
    src: comfyrobeMobileImage,
    alt: heroAlt,
    sizes: "100vw",
    loading: "eager",
    fetchPriority: "high",
  });

  return (
    <>
      <link rel="preload" as="image" media={desktopMedia} href={props.src} fetchPriority="high" />
      <link rel="preload" as="image" media="(max-width: 639px)" imageSrcSet={mobile.srcSet} imageSizes={mobile.sizes} fetchPriority="high" />
      <link rel="preload" as="image" media={tabletMedia} imageSrcSet={portrait.srcSet} imageSizes={portrait.sizes} fetchPriority="high" />
      <picture className="block w-full">
        <source media={desktopMedia} srcSet={props.src} width={props.width} height={props.height} />
        <source media={tabletMedia} srcSet={portrait.srcSet} sizes={portrait.sizes} width={portrait.width} height={portrait.height} />
        <img {...mobile} alt={heroAlt} className="block h-auto w-full" />
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
      <div className="relative">
        <HeroImage />
        <div className="absolute inset-x-0 top-[58%] z-10 flex flex-col items-center px-4 sm:top-[55%] sm:px-6">
          <h1 id="hero-h1" className="m-0 max-w-3xl text-center text-[clamp(1.25rem,4vw,3.5rem)] leading-[1.08] font-extrabold text-white uppercase lg:pointer-fine:text-[clamp(1.75rem,2.5vw,3.5rem)] lg:pointer-none:text-[clamp(1.75rem,2.5vw,3.5rem)]">
            <span className="block">Uanstrengt eleganse</span>{" "}
            <span className="block">for kjølige dager.</span>
          </h1>
          <p className="mt-2 max-w-xl text-center font-sans text-sm font-extralight text-[#dacec2] sm:mt-3 sm:text-lg lg:pointer-fine:mt-4 lg:pointer-fine:text-[clamp(1rem,1.25vw,1.5rem)] lg:pointer-none:mt-4 lg:pointer-none:text-[clamp(1rem,1.25vw,1.5rem)]">
            Omfavn høstsesongen med omsluttende luksus.
          </p>
          <div className="mt-4 flex w-full justify-center gap-3 sm:mt-5 lg:pointer-fine:gap-6 lg:pointer-none:gap-6">
            <a
              href="/comfy-xs"
              className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg border border-primary bg-primary px-5 font-sans text-base font-semibold text-foreground shadow-lg shadow-black/30 transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-14 sm:w-40 sm:flex-none lg:pointer-fine:h-16 lg:pointer-fine:w-52 lg:pointer-fine:text-lg lg:pointer-none:h-16 lg:pointer-none:w-52 lg:pointer-none:text-lg"
            >
              Kjøp XS
            </a>
            <a
              href="/comfy-xl"
              className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg border border-primary bg-(image:--background-gradient) px-5 font-sans text-base font-semibold text-foreground shadow-lg shadow-black/30 transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-14 sm:w-40 sm:flex-none lg:pointer-fine:h-16 lg:pointer-fine:w-52 lg:pointer-fine:text-lg lg:pointer-none:h-16 lg:pointer-none:w-52 lg:pointer-none:text-lg"
            >
              Kjøp XL
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
