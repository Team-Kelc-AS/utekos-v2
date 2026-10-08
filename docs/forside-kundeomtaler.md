# Kundeomtaler på forsiden

`SectionSocialProof` står direkte etter `HomeVideo` i `src/app/page.tsx`.
Kilden er `../utekos-headless/src/app/skreddersy-varmen/`:

- `components/SectionSocialProof.tsx` og `SectionSocialProof.module.css`
- `components/ReviewCard.tsx`
- `data/reviews.ts` og `utils/initialsFrom.ts`

De 16 anmeldelsene, overskriften, ingressen, stjernene, initialene og
beregningen av vurderingen er beholdt. Vurderingen hentes fortsatt fra
`techDownReviewBundle`, som allerede finnes identisk i v2.

Originalens doble rad, 90-sekunders CSS-animasjon, pause ved hover/fokus og
horisontal rulling ved redusert bevegelse er beholdt. De 16 duplikatene er
fortsatt skjult for skjermlesere. Ingen ny klientlogikk eller avhengigheter.

Importstier er tilpasset v2. Seksjonen har lokalt avgrensede Utekos-farger og
Google Sans Flex 120pt-varianten, med ExtraBold-overskrifter og Medium-brødtekst.

Lokalt kontrollert: kildeidentiske anmeldelsesdata, vurderingsdata, initiallogikk
og animasjons-CSS; ESLint, TypeScript og `git diff --check`; nettleser ved
1440 og 390 px, plassering etter videoen, 16 anmeldelser pluss 16 skjulte
duplikater, hover-/fokuspause, redusert bevegelse og ingen sideoverflyt.
Skjermbilder er åpnet og visuelt kontrollert. Produksjonsbygget bestod med 45
ruter etter ett nytt forsøk; første forsøk fikk Shopify 502 på mikrofiberens
relaterte produkter. Eksisterende varsel om Google Sans Flex-fallback gjenstår.
Ikke publisert.
