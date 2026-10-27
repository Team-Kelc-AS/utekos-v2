// SizeGuideCards.tsx
import "server-only";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Image from "next/image";
import type { ReactNode } from "react";

const cardSurface =
  "bg-[#001211] bg-[linear-gradient(90deg,#001211,#001a18,#001f1c,#001f1c,#001a18,#001211)]";
const cardShell =
  "flex h-full min-w-0 flex-col gap-5 rounded-[2rem] p-6 text-[length:inherit] text-[#f0eee9] ring-1 ring-[#f0eee9]/10 shadow-none [&_[data-slot=card-content]]:px-0 [&_[data-slot=card-header]]:px-0 [&_p]:my-2 [&_p]:leading-[1.6] [&_ul]:my-0 [&_ol]:my-0 has-data-[slot=card-footer]:pb-6";

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
  children,
}: {
  id: string;
  title: string;
  measurement: string;
  label?: string;
  tableId: string;
  children: ReactNode;
}) {
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
        <p className="mb-6 text-[clamp(1.15rem,2vw,1.5rem)] leading-[1.4]">
          <strong>{label}:</strong> <span>{measurement}</span>
        </p>
        <div className="grow">{children}</div>
      </CardContent>
      <CardFooter className="-mx-2 -mb-2 mt-auto block rounded-2xl border-[0.5px] border-[#f0eee9]/70 bg-[#001211] bg-[linear-gradient(90deg,#001211,#021715,#001a18,#031f1d,#001a18,#021715,#001211)] p-0">
        <a
          href={`#${tableId}`}
          aria-label={`Se tabellen for ${title}`}
          className="block min-h-14 rounded-[inherit] p-5 text-center text-xl font-extrabold text-[#f0eee9] no-underline hover:bg-white/5 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f0eee9]"
        >
          Se tabellen
        </a>
      </CardFooter>
    </Card>
  );
}

export function GuideNotice({ children }: { children: ReactNode }) {
  return (
    <aside className="my-8 flex flex-nowrap items-start gap-5 rounded-3xl bg-[#cb5005] bg-(image:--comfyrobe-banner-gradient) p-6 text-xl leading-normal text-[#f0eee9] [&_p]:m-0 [&_strong]:font-medium">
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
    <Card className={`my-5 ${cardShell} ${cardSurface}`}>
      <CardHeader>
        <CardTitle>
          <h4 className="m-0 mb-2 text-xl leading-tight font-extrabold">
            {number ? `${number}. ` : ""}
            {title}
          </h4>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grow">{children}</div>
      </CardContent>
    </Card>
  );
}
