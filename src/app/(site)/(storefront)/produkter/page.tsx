import { Suspense } from "react";
import {
  getCategoryMetadata,
  type CategoryPageProps,
} from "@/components/catalog/CategoryPage";
import { ProductOverview } from "@/components/catalog/ProductOverview";

// Wait for pagination validation/redirects before committing the response.
export const instant = false;

export function generateMetadata({ searchParams }: CategoryPageProps) {
  return getCategoryMetadata("all", searchParams);
}

export default function Page({ searchParams }: CategoryPageProps) {
  return (
    <>
      <Suspense
        fallback={
          <main
            className="flex-1 p-6 text-[#f0eee9]"
            style={{
              backgroundColor: "#001211",
              backgroundImage: "var(--background-gradient)",
            }}
            aria-busy="true"
          >
            Laster produktoversikten …
          </main>
        }
      >
        <ProductOverview searchParams={searchParams} />
      </Suspense>
    </>
  );
}
