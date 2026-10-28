import {
  Droplets,
  Flame,
  ShieldCheck,
  Shirt,
  Sparkles,
  Sun,
  Wind,
} from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap = {
  wind: Wind,
  sparkles: Sparkles,
  sun: Sun,
  shirt: Shirt,
  droplets: Droplets,
  shield: ShieldCheck,
  flame: Flame,
} as const;

export function CardGrid({
  cols = 4,
  layout = "grid",
  children,
}: {
  cols?: 2 | 3 | 4;
  layout?: "grid" | "rows";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "my-8 grid grid-cols-1 gap-5",
        layout === "grid" && cols === 2 && "md:grid-cols-2",
        layout === "grid" && cols === 3 && "md:grid-cols-3",
        layout === "grid" && cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {children}
    </div>
  );
}

export function InfoCard({
  icon = "sparkles",
  step,
  title,
  horizontal = false,
  children,
}: {
  icon?: keyof typeof iconMap;
  step?: string;
  title: string;
  horizontal?: boolean;
  children: React.ReactNode;
}) {
  const Icon = iconMap[icon] ?? Sparkles;
  const iconBadge = (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#001a18] text-[#71d7cf] ring-1 ring-[#287166]">
      <Icon className="size-5" />
    </div>
  );
  const stepLabel = step && (
    <span className={cn("text-sm font-extrabold text-[#c9d6d1]", !horizontal && "ml-auto shrink-0")}>
      {step}
    </span>
  );
  const heading = (
    <h3 className={cn("m-0 min-w-0 text-lg font-extrabold text-[#f0eee9]", horizontal ? "sm:w-64 sm:shrink-0" : "flex-1")}>
      {title}
    </h3>
  );
  const description = (
    <div className={cn("font-medium text-[#e2eeea] [&_p]:m-0!", horizontal && "mt-2 sm:mt-0")}>
      {children}
    </div>
  );

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-between rounded-2xl border border-[#18504a] bg-[#001211] bg-[linear-gradient(90deg,#001211,#001a18,#001f1c,#001f1c,#001a18,#001211)] p-6 text-left text-card-foreground transition-colors hover:border-[#287166]",
        horizontal &&
          "gap-4 border-[#287166] bg-[linear-gradient(96deg,#00120f_0%,#001b17_14%,#002620_28%,#06332c_42%,#093a32_50%,#042c26_70%,#001e19_85%,#00110e_100%)] sm:flex-row sm:items-center sm:gap-8 sm:px-8 sm:py-7",
      )}
    >
      {horizontal ? (
        <>
          <div className="flex shrink-0 items-center justify-between gap-4 sm:w-28">
            {iconBadge}
            {stepLabel}
          </div>
          <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-8">
            {heading}
            {description}
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            {iconBadge}
            {heading}
            {stepLabel}
          </div>
          {description}
        </>
      )}
    </div>
  );
}
