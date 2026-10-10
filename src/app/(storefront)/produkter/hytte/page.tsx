import { CategoryPage, getCategoryMetadata, type CategoryPageProps } from "@/components/catalog/CategoryPage";

// Wait for pagination validation/redirects before committing the response.
export const instant = false;

export function generateMetadata({ searchParams }: CategoryPageProps) {
  return getCategoryMetadata("hytte", searchParams);
}

export default function Page({ searchParams }: CategoryPageProps) {
  return <CategoryPage categoryKey="hytte" searchParams={searchParams} />;
}
