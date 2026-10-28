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

import Image from "next/image";
import type { ReactNode } from "react";
import { getProduct } from "@/lib/shopify/getProduct";
import { comfyBuyNowVariants, type ComfyBuyNowSize } from "@/lib/cart/comfyBuyNow";
import { ComfyrobeBuyNowButton } from "@/components/commerce/ComfyrobeBuyNowButton";

const cardSurface =
  "bg-[#001211] bg-[linear-gradient(90deg,#001211,#001a18,#001f1c,#001f1c,#001a18,#001211)]";
const cardShell =
  "flex h-full min-w-0 flex-col gap-5 rounded-[2rem] p-6 text-[length:inherit] text-foreground ring-1 ring-foreground/10 shadow-none [&_[data-slot=card-content]]:px-0 [&_[data-slot=card-header]]:px-0 [&_p]:my-2 [&_p]:leading-[1.6] [&_ul]:my-0 [&_ol]:my-0 has-data-[slot=card-footer]:pb-6";

const footerSurface =
  "bg-[#000b0a] bg-[linear-gradient(90deg,#000b0a_0%,#00110f_25%,#001a18_50%,#00110f_75%,#000b0a_100%)]";

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
  const actionLabel = checkout?.available ? checkout.label : checkout ? "Utsolgt" : "Se tabellen";
  return (
    <Card className={`${cardShell} ${cardSurface}`} aria-labelledby={id}>
      <CardHeader>
        <CardTitle>
          <h3
            id={id}
            className="m-0 mb-4 text-center text-[clamp(1.4rem,2vw,1.8rem)] leading-[1.15] font-extrabold"
          >
            {title}
          </h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-start">
        {image && (
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt={image.alt}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="mb-5 h-auto w-full rounded-xl"
          />
        )}
        {measurement && (
          <p className="mb-6 text-[clamp(1.15rem,2vw,1.5rem)] leading-[1.4]">
            <strong>{label}:</strong> <span>{measurement}</span>
          </p>
        )}
        <div className="grow">{children}</div>
      </CardContent>
      <CardFooter className={`-mx-2 -mb-2 mt-auto block rounded-2xl border-0 p-0 ${footerSurface}`}>
        {checkout && !checkout.available ? (
          <span className="block min-h-14 p-5 text-center text-xl font-extrabold text-foreground" aria-label={`${title} er utsolgt`}>
            {actionLabel}
          </span>
        ) : checkout ? (
          <ComfyrobeBuyNowButton
            size={checkout.size}
            className="block min-h-14 w-full cursor-pointer rounded-[inherit] border-0 bg-transparent p-5 text-center text-xl font-extrabold text-foreground hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-wait disabled:opacity-60"
          >
            {actionLabel}
          </ComfyrobeBuyNowButton>
        ) : (
          <a
            href={`#${tableId}`}
            aria-label={`Se tabellen for ${title}`}
            className="block min-h-14 rounded-[inherit] p-5 text-center text-xl font-extrabold text-foreground no-underline hover:bg-foreground/5 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
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
        <p className="mt-4 font-medium">Under 10 igjen på lager.</p>
      )}
    </SizeOptionCard>
  );
}

export function GuideNotice({ children }: { children: ReactNode }) {
  return (
    <aside className="my-8 flex flex-nowrap items-start gap-5 rounded-3xl bg-[#cb5005] bg-(image:--comfyrobe-banner-gradient) p-6 text-xl leading-normal text-foreground [&_p]:m-0 [&_strong]:font-medium">
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
  children,
}: {
  number?: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className={`min-w-0 self-start gap-0 rounded-[1.5rem] border-0 p-0 text-foreground shadow-none ring-1 ring-foreground/10 ${cardSurface}`}>
      <CardHeader className="items-center gap-4 px-6 py-6 max-[359px]:flex max-[359px]:flex-col max-[359px]:items-stretch lg:max-[1199px]:flex lg:max-[1199px]:flex-col lg:max-[1199px]:items-stretch">
        <CardTitle>
          <h4 className="m-0 text-xl leading-tight font-extrabold">
            {number ? `${number}. ` : ""}
            {title}
          </h4>
        </CardTitle>
        <CardAction className="max-[359px]:order-first max-[359px]:self-end lg:max-[1199px]:order-first lg:max-[1199px]:self-end">
          <Badge variant="ghost" aria-label="JUSTER. FORM. NYT." className="h-auto gap-1.5 rounded-full border-0 bg-[#000d0b] bg-[linear-gradient(90deg,#000d0b_0%,#001a16_25%,#002622_50%,#001a16_75%,#000d0b_100%)] px-3 py-2 text-[0.7rem] leading-none font-bold tracking-[0.03em]">
            <span className="text-[color:var(--mist)]">JUSTER.</span>
            <span className="text-[color:var(--mist)]">FORM.</span>
            <span className="text-primary">NYT.</span>
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className={`block border-0 px-6 py-5 text-base leading-relaxed text-foreground [&_p]:m-0! [&_p]:leading-relaxed ${footerSurface}`}>
        {children}
      </CardFooter>
    </Card>
  );
}
