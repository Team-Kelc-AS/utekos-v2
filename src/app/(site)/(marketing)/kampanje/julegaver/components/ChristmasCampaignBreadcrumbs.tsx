import Breadcrumbs from "@/components/Breadcrumbs";
import type { Route } from "next";

type ChristmasCampaignBreadcrumbsProps<T extends string> = {
  currentLabel: string;
  parentHref?: Route<T>;
  parentLabel?: string;
};

export function ChristmasCampaignBreadcrumbs<T extends string>({
  currentLabel,
  parentHref,
  parentLabel,
}: ChristmasCampaignBreadcrumbsProps<T>) {
  const items: { label: string; href?: Route<T> }[] = [{ label: "Forsiden", href: "/" }];

  if (parentHref && parentLabel) {
    items.push({ label: parentLabel, href: parentHref });
  }

  items.push({ label: currentLabel });

  return (
    <div className="container mx-auto px-4 pb-6 text-left">
      <div className="inline-flex rounded-full bg-card px-4 py-2 text-card-foreground shadow-sm ring-1 ring-border">
        <Breadcrumbs items={items} />
      </div>
    </div>
  );
}
