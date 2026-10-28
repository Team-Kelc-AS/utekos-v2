import Image from "next/image";

const sizeClasses = {
  sm: "w-28",
  md: "w-36",
  lg: "w-48",
} as const;

export function SkreddersyVarmenBadge({ size = "sm" }: { size?: keyof typeof sizeClasses }) {
  return (
    <Image
      src="/assets/logo/SkreddersyVarmen.svg"
      width={357}
      height={117}
      alt="Skreddersy varmen"
      loading="eager"
      unoptimized
      className={`block h-auto ${sizeClasses[size]}`}
    />
  );
}
