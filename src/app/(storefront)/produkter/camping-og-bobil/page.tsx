import {
  CategoryPage,
  getCategoryMetadata,
  type CategoryPageProps,
} from "@/components/catalog/CategoryPage";

export const instant = false;

export function generateMetadata({ searchParams }: CategoryPageProps) {
  return getCategoryMetadata("camping-og-bobil", searchParams);
}

export default function Page({ searchParams }: CategoryPageProps) {
  return (
    <CategoryPage
      categoryKey="camping-og-bobil"
      searchParams={searchParams}
      title="Skreddersy varmen på camping- og bobiltur"
      subtitle={
        <>
        <p className="text-lg mb-6">
          Morgenkaffen utenfor bobilen, en pause i campingstolen eller en lang
          kveld rundt campingbordet. Her finner du komfortable varmeplagg som
          både oppgraderer og forlenger de fine stundene utendørs. Juster, form
          og nyt.
        </p>
        <div className="prose">
          <p>
            Når du pakker klær til campingferien, bør du også tenke på tiden du
            skal tilbringe i ro. Et ekstra varmeplagg er godt å ha lett
            tilgjengelig når du setter deg utenfor bobilen eller campingvognen.
            Siden temperaturen synker raskt på kjølige morgener og kvelder, har
            vi samlet plagg som gir umiddelbar varme uten at du trenger å trekke
            innendørs. Velg ytterplagg etter sesong, og finn isolasjonen som
            passer ditt uteliv.
          </p>
        </div>
        </>
      }
    />
  );
}
