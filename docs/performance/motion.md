# Bevegelse med kontroll på klientkostnaden

Bevegelse og interaktivitet er ønsket. Bevar uttrykk, timing, innhold og funksjon
mens klientkode og kjøring reduseres. Færre kildekodetegn er nyttig når koden
fortsatt er tydelig; mål også komprimert JavaScript, lastetidspunkt og arbeid i
nettleseren. Flytting til en senere chunk reduserer ikke automatisk totalkostnaden.

## Intersport: implementert 2026-10-09

Serverkomponenten beholder innhold, original logo og markup. En liten klientwrapper
laster `intersport-motion.ts` når seksjonen kommer innenfor 400 px av synsfeltet.
Selve inngangen bruker fortsatt terskelen 20 % og bunnmargin −18 %.

`motion/mini` erstatter hybridmotoren. Logoens innkjøring, oversving, rotasjon,
risting, fem røykpartikler, åtte gnister, tekstinnfasing og CSS-pilen beholdes.
Native `transform`, `translate` og `opacity`-spor erstatter separate Motion-verdier.
Easing brukes per keyframe; logoens opacity når 1 ved 0,551 s, slik den opprinnelige
sekvensen faktisk gjorde. Serverinnholdet forblir tilgjengelig uten JavaScript.

Animert inngang spilles én gang og ryddes opp når den er ferdig, forlater synsfeltet
eller komponenten avmonteres. Redusert bevegelse hindrer importen; endring av
preferansen under kjøring eller lasting avbryter inngangen. Tastaturfokus og
lastefeil viser straks innholdet. Ingen permanent `will-change` eller ny global
Motion-provider er lagt til.

## Målte resultater

Next 16.3.8, Motion 14.0.0, lokal arbeidskopi på main. Før og etter er målt med
`pnpm exec next experimental-analyze --output`, filtrert til forsidens klient-JS.
Tallene er modulbidrag i analysegrafen, ikke overføringsstørrelse eller Core Web Vitals.

| Modulbidrag | Før | Etter |
| --- | ---: | ---: |
| Motion-pakker samlet | 52 960 B | 7 979 B |
| Egen kode for inngangen, alle chunks | 2 584 B | 2 510 B |
| Motion + egen kode samlet | 55 544 B | 10 489 B |
| Motion + egen kode ved første lasting | 55 544 B | 747 B |

CSS-moduleksportene er holdt utenfor denne sammenligningen. Hele nettbutikkens
React/Next-kode er også utenfor tallene. Motion-bidraget er redusert med 84,9 %;
hele funksjonens analyserte JS med 81,1 %.

En separat esbuild-sammenligning med samme loader viste hvorfor mini ble valgt:
utsatt hybrid lastet fortsatt omtrent 21,34 kB gzip for animasjonen; utsatt mini
lastet 4,11 kB. Dette er en isolert sammenligning, ikke Next-nettverksmålingen.

I nettleseren mot et lokalt produksjonsbygg var animasjonschunken:

- Ikke forespurt ved første sidevisning på mobil eller desktop.
- Lastet én gang ved tilnærming: 9 699 B dekodet, 3 851 B komprimert responsinnhold.
- Ikke lastet med redusert bevegelse eller deaktivert JavaScript.

Ingen PageSpeed- eller produksjons-CWV-forbedring er hevdet. Endringen er lokal,
uten commit, push eller deploy.

## Varig størrelseskontroll

`pnpm run perf:motion` måler feature-koden med esbuild, uten React/Next og CSS.
`pnpm build` kjører samme kontroll før Next-bygget. Grensene er:

- Maksimalt 700 B gzip for hele den statiske inngangen.
- Maksimalt 5 000 B gzip samlet, inkludert utsatte chunks.
- Ingen Motion-moduler i den statiske importkjeden; animasjonen må være utsatt.

Målt etter endringen: 479 B gzip initialt og 4 590 B gzip samlet. Budsjettet er en
regresjonskontroll, ikke en erstatning for Next-analyse og nettverksverifisering.
Ikke øk grensen som en rutinemessig løsning på en feil; undersøk importkjeden og
brukerbehovet først.

For nye bevegelser: bruk CSS der det dekker opplevelsen, mini for avgrensede
DOM-animasjoner og `react-m`/`LazyMotion` når React-komponenter, gestures eller
layout krever det. Behold servergrenser og last funksjoner der de brukes.
View transitions vurderes ved konkrete visningsbytter, med separat måling av
snapshot-/renderkostnad. Mer funksjonalitet krever tydeligere kostnadskontroll.

## Verifikasjon

- Produksjonsbygg, TypeScript, målrettet ESLint og størrelsesbudsjett bestått.
- Original og mini sammenlignet ved 12 tidspunkter på alle 16 animerte elementer.
  Opacity var lik; største avvik i transformmatrisekomponenter var 0,066 i både
  Chromium og WebKit.
- En isolert kjøring av hele inngangen registrerte 119 `requestAnimationFrame`-kall
  for originalen og 0 for mini. Dette er antall JS-planlegginger i testfixturen,
  ikke et mål på samlet CPU-tid, FPS eller nettbutikkens øvrige animasjoner.
- Mobil (390 px) og desktop (1440 px) kontrollert visuelt og i nettleseren.
- Ingen ny inngang ved andre scrollbesøk; ingen horisontal overflow.
- Redusert bevegelse, endring under animasjon, endring mens importen venter,
  avbrutt chunkforespørsel, tastaturfokus og deaktivert JavaScript kontrollert.
- Ingen ukontrollerte JavaScript-feil i disse nettleserscenarioene.

Firefox-verifikasjon gjenstår: den lokale Playwright-Firefoxen startet ikke på
grunn av sandbox-/framebufferfeil før siden kunne lastes. Det er ikke registrert
som en bestått test eller som en feil i butikkoden.

Råmålinger, førkopi, nettleserresultater og skjermbilder fra denne kjøringen ligger
lokalt i `/tmp/utekos-motion-optimization/`.

## Dokumentasjonsgrunnlag

- [Motion quick start](https://motion.dev/docs/quick-start)
- [Mini og hybrid animate](https://motion.dev/docs/animate)
- [Redusert bundle-størrelse](https://motion.dev/docs/react-reduce-bundle-size)
- [Next: lazy loading](https://nextjs.org/docs/app/guides/lazy-loading)
- [Next: package bundling](https://nextjs.org/docs/app/guides/package-bundling)

Next-guidene ble også kontrollert mot den installerte versjonens
`node_modules/next/dist/docs/` og Utekos Docs MCP.
