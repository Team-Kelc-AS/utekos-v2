import type { Route } from "next";
import type { productPath } from "@/lib/seo/site";

export type SearchItem = { title: string; href: Route<ReturnType<typeof productPath>>; keywords: string[] };
export type SearchGroup = { label: "Produkter" | "Sider"; items: SearchItem[] };
export type SearchIndex = { groups: SearchGroup[] };
