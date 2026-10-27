"use client";

import { useRef, useState } from "react";

import { Button } from "./button";
import type { ProductSizeGuideContent } from "@/lib/products/getProductSizeGuideContent";
import { Ruler } from "lucide-react";
import SizeGuideDialogContent from "./SizeGuideDialogContent";

type Props = {
  content: ProductSizeGuideContent;
  triggerClassName?: string;
  trackingData: Record<string, string>;
};
export function OsCaravanSizeGuideDialog({
  content,
  triggerClassName,
  trackingData,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        size="lg"
        variant="commerce-primary"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        data-track="OsCaravanSizeGuideOpen"
        data-track-data={JSON.stringify(trackingData)}
        className={triggerClassName}
      >
        <span className="truncate">Størrelsesguide</span>
        <Ruler className="size-4.5" aria-hidden />
      </Button>
      <SizeGuideDialogContent
        content={content}
        open={open}
        onOpenChange={setOpen}
        triggerRef={triggerRef}
      />
    </>
  );
}
