import {
  CategoryPage,
  getCategoryMetadata,
  type CategoryPageProps,
} from "@/components/catalog/CategoryPage";

export const instant = false;

export function generateMetadata({ searchParams }: CategoryPageProps) {
  return getCategoryMetadata("hytte", searchParams);
}

export default function Page({ searchParams }: CategoryPageProps) {
  // 1. Hovedoverskrift (H1) som fanger søkeintensjon
  const heroTitle =
    "Den moderne vinterdressen for voksne: Forleng hyttesesongen";

  const heroSubtitle = (
    <p className="text-xl font-medium mb-6 text-primary-foreground">
      Enten du henter ved i minusgrader eller drikker morgenkaffen på trappen.
      Utekos kombinerer isolasjonen fra en sovepose med bevegelsesfriheten til
      et ytterplagg. Med værbestandig ytre og romslig passform kan du pakke deg
      inn og forlenge kveldene ved bålpannen, på terrassen eller i hytteveggen.
    </p>
  );
  const bottomSeoContent = (
    <article className="mt-16 max-w-none text-primary-foreground">
      <h2>
        Hvorfor velge Utekos fremfor en termodress eller varmedress på hytten?
      </h2>
      <p>
        En pakkeliste for hyttetur om vinteren består tradisjonelt av mange lag;
        ullgenser, vindjakke, pledd, poncho eller en klumpete varmedress for de
        kaldeste dagene. Utekos løser hytteutfordringene dine med kompromissløs
        funksjonalitet og overlegen allsidighet, på en langt mer elegant måte:
      </p>
      <ul>
        <li>
          <strong>Smartere temperaturregulering: YKK® Dual V-Zip™):</strong>
          En varmedress blir fort en badstue hvis du går fra sprengkulde til
          varmen foran bålet. Utekos sitt to-spors glidelåssystem muliggjør
          effektiv ventilasjon uten at du må åpne frontpartiet helt og eksponere
          brystet for kald trekk.
        </li>
        <li>
          <strong>Luksuriøs mobilitet og romslighet:</strong>
          Mens en termodress ofte føles som stivt og tungt arbeidstøy, har
          Utekos en romslig passform som tillater en tykk ullgenser under uten
          at det noensinne føles trangt. Det matte Luméa™-skallet gir dessuten
          en sofistikert eleganse som passer like godt med et glass vin som med
          en øks.
        </li>
        <li>
          <strong>Den unike 3-i-1 funksjonaliteten:</strong>
          En vinterdress strammer over knærne når du setter deg. Utekos kan
          derimot raskt konfigureres fra en mobil parkas for aktivitet, til en
          fulldekket, soveposelignende beskyttelse for dyp avslapning i
          campingstolen eller hytteveggen.
        </li>
        <li>
          <strong>Tåler et levd hytteliv:</strong>
          Slutt å være redd for at gnister skal ødelegge dyre ullpledd og lette
          dunjakker. Utekos TechDown™ sitt slitesterke ytterstoff tåler et levd
          liv rundt bålpannen.
        </li>
      </ul>
    </article>
  );

  return (
    <CategoryPage
      categoryKey="hytte"
      searchParams={searchParams}
      title={heroTitle}
      subtitle={heroSubtitle}
      bottomContent={bottomSeoContent}
    />
  );
}
