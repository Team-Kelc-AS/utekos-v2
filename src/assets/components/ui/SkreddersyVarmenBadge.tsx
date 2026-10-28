import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

const sizeClasses = {
  sm: "text-[0.625rem]",
  md: "text-xs",
  lg: "text-base",
} as const;

export function SkreddersyVarmenBadge({ size = "sm" }: { size?: keyof typeof sizeClasses }) {
  return (
    <Badge
      variant="ghost"
      className={cn(
        "h-auto w-fit gap-0 rounded-[30%] border-[0.625px] border-primary bg-transparent p-0 font-sans font-bold whitespace-nowrap text-foreground",
        sizeClasses[size],
      )}
    >
      <span className="bg-[#000d0b] bg-[linear-gradient(90deg,#000d0b_0%,#001a16_25%,#002622_50%,#001a16_75%,#000d0b_100%)] px-[0.5em] py-[0.5em] leading-none">
        Skreddersy
      </span>
      <span className="sr-only"> </span>
      <span className="bg-primary px-[0.5em] py-[0.5em] leading-none">varmen</span>
    </Badge>
  );
}
