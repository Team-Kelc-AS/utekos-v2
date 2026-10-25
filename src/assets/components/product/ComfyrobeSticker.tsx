import Image from 'next/image';

export function ComfyrobeSticker({ className }: { className: string }) {
  return <Image
    src="/images/products/comfyrobe/Comfyrobe50PercentSticker.svg"
    alt="50 % rabatt"
    width={418}
    height={455}
    className={className}
    unoptimized
  />;
}
