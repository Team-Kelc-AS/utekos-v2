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
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-between rounded-2xl border border-[#18504a] bg-[#001211] bg-[linear-gradient(90deg,#001211,#001a18,#001f1c,#001f1c,#001a18,#001211)] p-6 text-left text-card-foreground transition-colors hover:border-[#287166]",
        horizontal &&
          "gap-4 border-[#287166] bg-[linear-gradient(90deg,#012622,#0b302c,#185045,#0b302c,#012622)] sm:flex-row sm:items-center sm:gap-8 sm:px-8 sm:py-7",
      )}
    >
      <div className={cn("mb-4 flex items-center justify-between", horizontal && "mb-0 shrink-0 gap-4 sm:w-28")}>
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#001a18] text-[#71d7cf] ring-1 ring-[#287166]">
          <Icon className="size-5" />
        </div>
        {step && (
          <span className="text-sm font-extrabold text-[#c9d6d1]">
            {step}
          </span>
        )}
      </div>
      <div className={cn(horizontal && "min-w-0 flex-1 sm:flex sm:items-center sm:gap-8")}>
        <h3 className={cn("m-0 text-lg font-extrabold text-[#f0eee9]", horizontal && "sm:w-64 sm:shrink-0")}>
          {title}
        </h3>
        <div className={cn("mt-2 font-medium text-[#e2eeea] [&_p]:m-0", horizontal && "sm:mt-0")}>
          {children}
        </div>
      </div>
    </div>
  );
}
