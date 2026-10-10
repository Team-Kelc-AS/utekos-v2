import "server-only";

import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ImageCardProps = {
  href: string;
  title: string;
  description: string;
  image: Pick<ImageProps, "src" | "alt" | "width" | "height">;
  action: string;
  badge: string;
};

export function ImageCard({
  href,
  title,
  description,
  image,
  action,
  badge,
}: ImageCardProps) {
  return (
    <Card className="relative mx-auto h-full w-full max-w-sm bg-interstellar pt-0 text-[#f0eee9] border border-primary/82 ring-0">
      <Image
        {...image}
        alt={image.alt}
        sizes="(max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) calc(50vw - 2.25rem), (max-width: 1279px) calc(25vw - 1.875rem), 290px"
        className="block h-auto w-full"
      />
      <CardHeader className="min-w-0 flex-1 gap-x-3 gap-y-2 has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto]">
        <CardAction className="row-span-1">
          <Badge
            variant="secondary"
            className="border-primary/82 bg-[#001a18] font-medium text-[#f0eee9]"
          >
            {badge}
          </Badge>
        </CardAction>
        <CardTitle
          role="heading"
          aria-level={3}
          title={title}
          className="min-w-0 truncate"
        >
          {title}
        </CardTitle>
        <CardDescription className="col-span-full line-clamp-2 min-h-10 font-medium leading-5 text-foreground/75">
          {description}
        </CardDescription>
      </CardHeader>
      <CardFooter className="bg-[#001a18]">
        <Button
          render={<Link href={href} prefetch={false} />}
          nativeButton={false}
          className="w-full min-w-0 bg-[#b44701] text-[#f0eee9] hover:bg-[#b44701]/90"
        >
          <span className="truncate">{action}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
