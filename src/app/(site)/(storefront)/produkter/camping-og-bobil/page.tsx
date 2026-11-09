import {
  getCategoryMetadata,
  type CategoryPageProps,
} from "@/components/catalog/CategoryPage";
import { CampingPage } from "@/components/catalog/CampingPage";

// Wait for pagination validation/redirects before committing the response.
export const instant = false;
export function generateMetadata({ searchParams }: CategoryPageProps) {
  return getCategoryMetadata("camping-og-bobil", searchParams);
}
export default function Page({ searchParams }: CategoryPageProps) {
  return <CampingPage searchParams={searchParams} />;
}
