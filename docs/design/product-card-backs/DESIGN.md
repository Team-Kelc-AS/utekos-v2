# Design System: Utekos produktkortenes bakside

## 1. Visual Theme & Atmosphere
Behold dagens produktkaruseller. En rolig, brukerutløst vending av bildeflaten
avdekker det originale fargearket for den konkrete produktvarianten.

## 2. Color Palette & Roles
- Mørkegrønn (#001a18): bakgrunn og pilknapp.
- Kortgrønn (#012622): knappens hovertilstand.
- Lys tekst (#f0eee9): pil, kant og fokusmarkering.
- Utekos-oransje (#b44701): eksisterende kjøpshandlinger.
Fargearkene er originale produktreferanser og vises med sine eksisterende farger.

## 3. Typography Rules
Behold eksisterende Google Sans Flex 120pt-variant, ExtraBold/Medium og
setningskasus. 120pt betegner fontvarianten, ikke tekststørrelsen. Behold
produktnavn, ™ og originale merker. Arkene skal ikke tegnes eller settes på nytt.

## 4. Component Stylings
En egen rund pilknapp på 44 × 44 px vender bare kortets bildeflate.
Samme knapp vender tilbake. Produktlenker, variant-ID og kjøpshandlinger beholdes.
Ved video skjules vendeknappen under avspilling; den vises igjen når bildet kommer
tilbake etter avsluttet video, Escape eller avspillingsfeil.

Variantkobling: TechDown Havdyp → Maritime Blue; Svale → Maritime Blue med
Moonstruck-tekst; Dun og Mikrofiber Vargnatt → Anthracite; Dun og Mikrofiber
Fjellblå → Patriot Blue. De to siste koblingene og utelatelsen av Comfyrobe er
uttrykkelig avklart med brukeren. Fjellnatt skal ikke få Patriot Blue.

## 5. Layout Principles
Forside og bakside bruker hver sin originale ratio med full bredde og automatisk
høyde. Arkene er 1000 × 1500 px. Ingen crop, padding, stretch eller zoom for å
passe en annen ratio. Produktoversiktens overlagrede innhold tilhører forsiden
og skal ikke skjule fargearket på baksiden.

## 6. Motion & Interaction
480 ms CSS-vending rundt Y-aksen med kontrollert utbremsing. Bare transform
animeres. Ingen automatisk vending eller evig animasjon. Ved redusert bevegelse
byttes side uten overgang. Skjult side er inert og skjult for skjermlesere.
Pilknappen betjenes med tastatur; Escape vender tilbake til produktbildet.

## 7. Anti-Patterns (Banned)
Ingen redesign av karusellen, nye fonter, nye produktpåstander, bildegenerering,
endring av originalark eller automatisk publisering. Ingen fargekobling basert
utelukkende på filrekkefølge eller antatt Shopify-variantrekkefølge.
