export const NBCC_PATH = "/produkter/camping-og-bobil/nbcc";
export const NBCC_LOGIN_URL = "https://gnist.styreweb.com/Account/Login?ReturnUrl=%2F";
export const NBCC_PARTNER_URL = "https://www.nbocc.no/informasjon/nyheter/vis/?ID=61253";

export const nbccPage = {
  title: "NBCC-medlemsfordel til camping og bobil",
  heading: "NBCC-medlemsfordel hos Utekos",
  description: "Medlem i Norsk Bobil og Caravan Club? Se Utekos-plagg til camping, bobil og fortelt, finn riktig størrelse og les hvordan du bruker medlemsfordelen.",
  intro: "Utekos er samarbeidspartner med Norsk Bobil og Caravan Club (NBCC). Som medlem får du rabatt på utvalgte Utekos-plagg til camping, bobil og fortelt. Hent medlemskoden på Min Side eller i Gnist-appen, og bruk den i kassen. Har lokalavdelingen en egen avtale, kan du bruke avdelingens kode og støtte det lokale fellesskapet.",
};

export const nbccUseCases = [
  { title: "Utenfor bobilen", description: "Ta steget ut og nyt morgenkaffen i duggfrisk luft, med et varmt plagg klart ved døren." },
  { title: "Skumringstimen", description: "Når campingbordet er slått ut og den varme ettermiddagen glir over i en kjølig kveld." },
  { title: "Ved campingvognen", description: "For stundene der du helst vil bli sittende ute litt til, ved vognen eller i forteltet." },
  { title: "Spontane nabobesøk", description: "Når campingnaboen stikker innom og praten fortsetter under markisen." },
  { title: "På treff og tur", description: "Ta med et varmt lag til de sosiale stundene rundt campingbordet med gjengen." },
  { title: "På fastplassen og hjemme", description: "Et plagg til pausene på fastplassen kan også bli med til hytta, båten eller terrassen hjemme." },
] as const;

export const nbccSteps = [
  { title: "Finn fordelen hos NBCC", description: "Logg inn på Min Side hos NBCC eller åpne det digitale medlemskortet i Gnist-appen. Finn Utekos under medlemsfordeler og hent koden der." },
  { title: "Velg produktene hos Utekos", description: "Sammenlign Utekos TechDown™, Utekos Mikrofiber™ og Comfyrobe™. Velg størrelse og legg produktene du ønsker i handlekurven." },
  { title: "Bruk fordelen i kassen", description: "Skriv medlemskoden i rabattfeltet. Kontroller at rabatten er trukket fra før du betaler. Gjeldende vilkår finner du hos NBCC." },
] as const;

export const nbccFaqItems = [
  { question: "Hvor finner jeg fordelskoden?", answer: "Som NBCC-medlem finner du rabattkoden på Min Side hos NBCC eller i Gnist-appen under medlemsfordeler. Skriv koden i kassen hos Utekos og kontroller medlemsprisen før betaling." },
  { question: "Kan jeg støtte min lokalavdeling?", answer: "Sjekk om lokalavdelingen din har en egen avtale med Utekos. NBCC anbefaler i så fall avdelingens rabattkode. Rabatten er den samme, samtidig som kjøpet støtter lokalavdelingen." },
  { question: "Kan plagget brukes av både kvinner og menn?", answer: "Ja. Utekos TechDown™, Utekos Mikrofiber™ og Comfyrobe™ har unisex-varianter. Modellene har ulik passform og lengde. Sammenlign målene i størrelseshjelpen før du velger." },
  { question: "Hvilket Utekos-produkt passer best på camping?", answer: "Velg ut fra bruken. TechDown™ har CloudWeave™-isolasjon og kan tilpasses mellom fullengde, oppfestet modus og parkas. Mikrofiber™ er et lettere alternativ til reisedager og pauser ute. Comfyrobe™ kombinerer et vanntett skall med Sherpa-fleece og passer også etter bad." },
  { question: "Kan jeg bruke Utekos i forteltet?", answer: "Ja. Et Utekos-plagg kan brukes som et ekstra varmt lag når du sitter i forteltet eller under markisen. Velg modell og størrelse ut fra været, klærne under og hvor mye bevegelsesfrihet du trenger." },
  { question: "Hva hvis størrelsen ikke passer?", answer: "Sammenlign størrelsesmålene før du bestiller. Hvis du trenger hjelp med et kjøp eller et størrelsesbytte, finner du kontaktinformasjon og returvilkår i ordrebekreftelsen." },
] as const;

// Migrated from the source size guide, retaining the actual Storefront labels.
// Comfyrobe's former AI fallback called XS/XL S/L; do not propagate that mismatch.
export const nbccSizeGuides = [
  {
    title: "Utekos TechDown™", columns: ["Middels", "Stor", "Større"],
    intro: "Normal passform over skuldre, bryst og ermer, med plass til lette lag. Høyderådene er veiledende; se også på målene og ønsket romslighet.",
    rows: [
      { label: "Veiledende kroppshøyde", values: ["165–175 cm", "175–185 cm", "185 cm og høyere"] },
      { label: "Lengde", values: ["162 cm", "166 cm", "170 cm"] },
      { label: "Bryst (flatmål)", values: ["56 cm", "58 cm", "61 cm"] },
      { label: "Ermlengde fra senter", values: ["82 cm", "87 cm", "92 cm"] },
    ],
  },
  {
    title: "Utekos Mikrofiber™", columns: ["Medium", "Large"],
    intro: "Mikrofiber™ kan tilpasses med snorstramming. Start med total lengde, og vurder hvor mye plass du trenger til klær under.",
    rows: [
      { label: "Lengde fra nakke til bunn", values: ["170 cm", "200 cm"] },
      { label: "Bryst (flatmål)", values: ["66 cm", "75 cm"] },
      { label: "Armlengde fra senter bryst", values: ["85 cm", "100 cm"] },
    ],
  },
  {
    title: "Comfyrobe™", columns: ["XS", "XL"],
    intro: "Comfyrobe™ har romslig passform, forlenget rygg og splitter i sidene. Størrelsene her følger produktkortene: XS og XL.",
    rows: [
      { label: "Lengde fra skulder til front", values: ["97 cm", "113 cm"] },
      { label: "Bredde over bryst", values: ["65 cm", "77 cm"] },
      { label: "Ermelengde", values: ["57 cm", "66 cm"] },
    ],
  },
] as const;
