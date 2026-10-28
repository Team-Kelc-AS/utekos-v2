// SizeGuideCards.tsx
import "server-only";

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkreddersyVarmenBadge } from "@/components/ui/SkreddersyVarmenBadge";
import { cn } from "cn";

import Image from "next/image";
import type { ReactNode } from "react";
import { getProduct } from "@/lib/shopify/getProduct";
import { comfyBuyNowVariants, type ComfyBuyNowSize } from "@/lib/cart/comfyBuyNow";
import { ComfyrobeBuyNowButton } from "@/components/commerce/ComfyrobeBuyNowButton";

const cardSurface =
  "bg-[#001211] bg-[linear-gradient(90deg,#001211,#001a18,#001f1c,#001f1c,#001a18,#001211)]";
const cardShell =
  "flex h-full min-w-0 flex-col gap-5 rounded-[2rem] p-6 text-[length:inherit] text-foreground ring-1 ring-foreground/10 shadow-none [&_[data-slot=card-content]]:px-0 [&_[data-slot=card-header]]:px-0 [&_p]:my-2 [&_p]:leading-[1.6] [&_ul]:my-0 [&_ol]:my-0 has-data-[slot=card-footer]:pb-6";
const comfyCardShell =
  "flex h-full min-w-0 flex-col gap-0 rounded-[1.5rem] p-0 text-foreground ring-1 ring-foreground/10 shadow-none";
const comfyHeaderSurface =
  "bg-[#001a18] bg-[linear-gradient(90deg,#001a18_0%,#012622_25%,#06332e_50%,#012622_75%,#001a18_100%)]";

const footerSurface =
  "bg-[#000b0a] bg-[linear-gradient(90deg,#000b0a_0%,#00110f_25%,#001a18_50%,#00110f_75%,#000b0a_100%)]";
const guideBadgeSurface =
  "bg-[#000d0b] bg-[linear-gradient(90deg,#000d0b_0%,#001a16_25%,#002622_50%,#001a16_75%,#000d0b_100%)]";
const guideStepHeaderClasses = {
  standard: "gap-3 px-6 pt-6 pb-9 max-[359px]:pb-5 lg:max-[1199px]:pb-5",
  stacked: "gap-4 px-6 py-6",
  warmth: "gap-2 px-5 py-6 sm:px-6",
} as const;

function GuideAdjustBadge({ stacked = false }: { stacked?: boolean }) {
  return (
    <Badge
      variant="ghost"
      aria-label="JUSTER. FORM. NYT."
      className={cn(
        "h-auto border-0 px-3 py-2 text-[0.7rem] leading-none font-bold tracking-[0.03em]",
        stacked
          ? "flex-col items-start gap-1 rounded-xl"
          : "gap-1.5 rounded-full max-[359px]:gap-1 max-[359px]:px-2 max-[359px]:text-[0.6rem]",
        guideBadgeSurface,
      )}
    >
      <span className="text-[color:var(--mist)]">JUSTER.</span>
      <span className="text-[color:var(--mist)]">FORM.</span>
      <span className="text-primary">NYT.</span>
    </Badge>
  );
}

export const measurementSectionClasses =
  "scroll-mt-28 [&_thead]:bg-[linear-gradient(90deg,#001211,#021715,#001a18,#031f1d,#001a18,#021715,#001211)]! [&_thead_th]:bg-transparent! [&_tbody_tr:nth-child(odd)]:bg-[linear-gradient(90deg,#001211,#010b0a,#001a18,#001f1c,#001a18,#010b0a,#001211)]! [&_tbody_tr:nth-child(even)]:bg-[linear-gradient(135deg,#001a18,#012622,#052b27,#0b302c,#052b27,#012622,#001a18)]! [&_tbody_tr]:hover:bg-[#f0eee9]/5";

export function SizeGuideGrid({ children }: { children: ReactNode }) {
  return (
    <div className="my-8 grid items-stretch gap-5 sm:grid-cols-2 lg:has-[>:nth-child(3)]:grid-cols-3">
      {children}
    </div>
  );
}

export function SizeOptionCard({
  id,
  title,
  measurement,
  label = "Din høyde",
  tableId,
  image,
  checkout,
  children,
}: {
  id: string;
  title: string;
  measurement?: string;
  label?: string;
  tableId?: string;
  image?: { src: string; width: number; height: number; alt: string };
  checkout?: { size: ComfyBuyNowSize; label: string; available: boolean };
  children: ReactNode;
}) {
  const isComfyCard = Boolean(image);
  const actionLabel = checkout?.available ? checkout.label : checkout ? "Utsolgt" : "Se tabellen";
  const actionSpacing = isComfyCard ? "min-h-12 px-5 py-3.5" : "min-h-14 p-5";
  return (
    <Card className={`${isComfyCard ? comfyCardShell : cardShell} ${cardSurface}`} aria-labelledby={id}>
      <CardHeader className={isComfyCard
        ? `items-center gap-3 px-5 py-4 sm:px-6 ${comfyHeaderSurface}`
        : "items-center gap-3"}>
        <CardTitle className="min-w-0 self-center">
          <h3
            id={id}
            className={isComfyCard
              ? "m-0 text-left text-[clamp(1.25rem,1.7vw,1.55rem)] leading-tight font-extrabold"
              : "m-0 text-left text-[clamp(1.4rem,2vw,1.8rem)] leading-[1.15] font-extrabold"}
          >
            {title}
          </h3>
        </CardTitle>
        <CardAction className="row-span-1 self-center">
          {image ? (
            <Image
              src={image.src}
              width={image.width}
              height={image.height}
              alt={image.alt}
              sizes="(max-width: 640px) 72px, 84px"
              className="block h-auto w-[4.5rem] object-contain sm:w-[5.25rem]"
            />
          ) : (
            <GuideAdjustBadge />
          )}
        </CardAction>
      </CardHeader>
      <CardContent className={isComfyCard ? "flex min-h-0 flex-1 flex-col p-0" : "flex flex-1 flex-col justify-start"}>
        {measurement && (
          <p className="mb-6 text-[clamp(1.15rem,2vw,1.5rem)] leading-[1.4]">
            <strong>{label}:</strong> <span>{measurement}</span>
          </p>
        )}
        <div className={isComfyCard
          ? "flex-1 px-5 py-3 text-base leading-[1.45] sm:px-6 [&_p]:m-0! [&_p]:leading-[1.45]"
          : "grow"}
        >
          {children}
        </div>
      </CardContent>
      <CardFooter className={isComfyCard
        ? `mt-auto block rounded-none border-0 p-0 ${footerSurface}`
        : `-mx-2 -mb-2 mt-auto block rounded-2xl border-0 p-0 ${footerSurface}`}
      >
        {checkout && !checkout.available ? (
          <span className={`block text-center text-xl font-extrabold text-foreground ${actionSpacing}`} aria-label={`${title} er utsolgt`}>
            {actionLabel}
          </span>
        ) : checkout ? (
          <ComfyrobeBuyNowButton
            size={checkout.size}
            className={`block w-full cursor-pointer rounded-[inherit] border-0 bg-transparent text-center text-xl font-extrabold text-foreground hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-wait disabled:opacity-60 ${actionSpacing}`}
          >
            {actionLabel}
          </ComfyrobeBuyNowButton>
        ) : (
          <a
            href={`#${tableId}`}
            aria-label={`Se tabellen for ${title}`}
            className={`block rounded-[inherit] text-center text-xl font-extrabold text-foreground no-underline hover:bg-foreground/5 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground ${actionSpacing}`}
          >
            {actionLabel}
          </a>
        )}
      </CardFooter>
    </Card>
  );
}

export async function ComfyrobeSizeCard({
  size,
  children,
}: {
  size: ComfyBuyNowSize;
  children: ReactNode;
}) {
  const product = await getProduct("comfyrobe");
  const variant = product?.variants.nodes.find((item) => item.id === comfyBuyNowVariants[size]);
  if (!variant) throw new Error(`Comfyrobe ${size.toUpperCase()} er ikke tilgjengelig i produktkatalogen.`);

  const isXs = size === "xs";
  const title = `Comfyrobe™ ${size.toUpperCase()}`;
  return (
    <SizeOptionCard
      id={`velg-${size}-hvis-`}
      title={title}
      image={{
        src: `/images/products/comfyrobe/comfy-${size}.webp`,
        width: 395,
        height: isXs ? 317 : 310,
        alt: `Størrelsesmerke for ${title}`,
      }}
      checkout={{ size, label: `Kjøp ${size.toUpperCase()}`, available: variant.availableForSale }}
    >
      {children}
      {isXs && variant.availableForSale && variant.quantityAvailable !== null && variant.quantityAvailable > 0 && variant.quantityAvailable < 10 && (
        <span className="mt-2 block font-medium">Under 10 igjen på lager.</span>
      )}
    </SizeOptionCard>
  );
}

export function GuideNotice({ children }: { children: ReactNode }) {
  return (
    <aside className="my-8 flex flex-nowrap items-start gap-5 rounded-3xl bg-[#cb5005] bg-(image:--comfyrobe-banner-gradient) p-6 text-xl leading-normal text-foreground [&_p]:m-0! [&_strong]:font-medium">
      <Image
        src="/images/size-guide/listen.svg"
        width={35}
        height={35}
        alt=""
        aria-hidden="true"
        className="mt-1 size-10 shrink-0"
      />
      <div>{children}</div>
    </aside>
  );
}

export function GuideInfoCard({ children }: { children: ReactNode }) {
  return (
    <Card className={`my-5 ${cardShell} ${cardSurface}`}>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function GuideStep({
  number,
  title,
  badge = "standard",
  children,
}: {
  number?: number;
  title: string;
  badge?: "standard" | "stacked" | "warmth";
  children: ReactNode;
}) {
  return (
    <Card className={`min-w-0 self-start gap-0 rounded-[1.5rem] border-0 p-0 text-foreground shadow-none ring-1 ring-foreground/10 ${cardSurface}`}>
      <CardHeader className={guideStepHeaderClasses[badge]}>
        <CardTitle className={cn("min-w-0", badge !== "warmth" && "self-center")}>
          <h4 className="m-0 text-left text-xl leading-tight font-extrabold">
            {number ? `${number}. ` : ""}
            {title}
          </h4>
        </CardTitle>
        <CardAction className={cn("row-span-1", badge !== "warmth" && "self-center")}>
          {badge === "warmth" ? (
            <SkreddersyVarmenBadge size="sm" />
          ) : (
            <GuideAdjustBadge stacked={badge === "stacked"} />
          )}
        </CardAction>
      </CardHeader>
      <CardFooter className={`block border-0 px-6 py-5 text-base leading-relaxed text-foreground [&_p]:m-0! [&_p]:leading-relaxed ${footerSurface}`}>
        {children}
      </CardFooter>
    </Card>
  );
}
