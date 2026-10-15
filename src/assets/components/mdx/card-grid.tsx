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
  children,
}: {
  cols?: 2 | 3 | 4;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "my-8 grid grid-cols-1 gap-4",
        cols === 2 && "md:grid-cols-2",
        cols === 3 && "md:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
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
  children,
}: {
  icon?: keyof typeof iconMap;
  step?: string;
  title: string;
  children: React.ReactNode;
}) {
  const Icon = iconMap[icon] ?? Sparkles;
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 text-left text-card-foreground transition-colors hover:border-primary/60">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-border">
          <Icon className="size-5" />
        </div>
        {step && (
          <span className="text-xs font-extrabold text-muted-foreground/60">
            {step}
          </span>
        )}
      </div>
      <div>
        <h3>{title}</h3>
        <div>{children}</div>
      </div>
    </div>
  );
}
