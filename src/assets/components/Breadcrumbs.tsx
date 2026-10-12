import "server-only";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/Breadcrumb";

import { Fragment } from "react";
import type { Route } from "next";
import Link from "next/link";

type Crumb<T extends string> = { label: string; href?: Route<T> };

export default function Breadcrumbs<T extends string>({ items }: { items: readonly Crumb<T>[] }) {
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
