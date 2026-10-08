import "server-only";

import { Fragment } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/Breadcrumb";

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  return (
    <Breadcrumb aria-label="Brødsmuler">
      <BreadcrumbList>
        {items.map(({ label, href }, index) => (
          <Fragment key={`${label}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {href ? (
                <BreadcrumbLink render={<Link href={href} prefetch={false} />}>
                  {label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
