/**
 * Original vector compositions, rendered directly at 1200 × 630 (no image resizing).
 * Run after `pnpm build`: node scripts/seo/render-knowledge-social.mjs [latin-variable.woff2]
 * Uses the same Google Sans Flex font downloaded by next/font; axes verified with fontkit.
 * The actual original wordmark is embedded unchanged. No generated replacement logo.
 * Changed images require a new SEO_IMAGE_VERSION (for example v2) and registry URLs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
const version = process.env.SEO_IMAGE_VERSION ?? 'v1';
if (!/^v[1-9]\d*$/.test(version)) throw new Error('SEO_IMAGE_VERSION must be v1, v2, ...');
const fontkit = require('@pdf-lib/fontkit');
const candidates = process.argv[2] ? [process.argv[2]] : fs.readdirSync('.next/static/media')
  .filter(file => file.endsWith('.woff2')).map(file => path.join('.next/static/media', file));
const fontPath = candidates.find(file => {
  try {
    const font = fontkit.create(fs.readFileSync(file));
    return font.familyName === 'Google Sans Flex' && font.variationAxes.opsz?.max >= 120
      && [...'Uteguidenæøå™'].every(c => font.hasGlyphForCodePoint(c.codePointAt(0)));
  } catch { return false; }
});
if (!fontPath) throw new Error('Build first, or supply a Google Sans Flex variable Latin WOFF2 with opsz 120.');
const font = fs.readFileSync(fontPath).toString('base64');
const logo = fs.readFileSync('public/WordmarkWhite.svg').toString('base64');
const C = '#f0eee9', O = '#b44701', D = '#001a18';
const stroke = `fill="none" stroke="${C}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`;
const mountains = `<path d="M20 330 115 185 191 278 260 148 415 330" ${stroke}/><path d="m88 226 27-41 30 40m89-38 26-39 34 47" ${stroke}/>`;
const tent = `<path d="M42 341 209 119 379 341Z" ${stroke}/><path d="M209 119v222m0-126 87 126" ${stroke}/><path d="M55 363h330" ${stroke}/><circle cx="332" cy="83" r="25" fill="${O}"/>`;
const snow = `<g ${stroke}><path d="M215 35v90m-39-68 78 45m-78 0 78-45"/></g>`;
const warmth = `<path d="M154 119c-67 73 66 84 0 158m61-181c-67 73 66 84 0 158m61-135c-67 73 66 84 0 158" fill="none" stroke="${O}" stroke-width="15" stroke-linecap="round"/>`;
const motifs = {
  overview: mountains + `<circle cx="324" cy="88" r="36" fill="${O}"/><path d="M73 370h287" ${stroke}/>` ,
  christmas: `<rect x="81" y="181" width="276" height="181" rx="7" ${stroke}/><path d="M64 161h310v53H64zm154 0v201" ${stroke}/><path d="M218 159c-138-11-132-116-65-92 38 14 64 92 64 92 15-80 47-113 78-88 45 37-20 83-77 88" fill="none" stroke="${O}" stroke-width="12"/>`,
  terrace: `<path d="M56 126h328M83 126v212m99-212v125m105-125v212m-231 0h328M57 98l158-54 169 54" ${stroke}/><path d="M116 337v-73h85v73m-46-73v-37h45M326 184v150" ${stroke}/><path d="M302 185h49l-10-46h-28Z" fill="${O}"/>`,
  cloud: `<path d="M51 107c73-106 118 100 193 0s125-38 143-13M51 165c73-106 118 100 193 0s125-38 143-13M51 223c73-106 118 100 193 0s125-38 143-13M51 281c73-106 118 100 193 0s125-38 143-13M51 339c73-106 118 100 193 0s125-38 143-13" fill="none" stroke="${C}" stroke-width="8"/><circle cx="223" cy="221" r="46" fill="${O}"/><circle cx="223" cy="221" r="22" fill="${D}"/>`,
  layers: `<path d="m45 155 174-93 174 93-174 93Z" fill="${O}"/><path d="m45 215 174 93 174-93m-348 64 174 93 174-93" ${stroke}/><path d="m78 136 142-74 140 76" fill="none" stroke="${C}" stroke-width="5"/>`,
  warm: mountains + `<g transform="translate(90,-20) scale(.65)">${warmth}</g>`,
  cold: snow + `<path d="M201 167a25 25 0 0 1 50 0v124a49 49 0 1 1-50 0Z" ${stroke}/><path d="M226 245v79" stroke="${O}" stroke-width="14" stroke-linecap="round"/><circle cx="226" cy="332" r="23" fill="${O}"/>`,
  zipper: `<path d="M126 54v326m181-326v326" ${stroke}/>${Array.from({length:8},(_,i)=>`<path d="M135 ${63+i*41}h47v21h-47m163-21h-47v21h47" fill="${i%2?C:O}"/>`).join('')}<path d="M190 185h55v77h-55Zm27 77v65" ${stroke}/>` ,
  glamping: tent,
  norway: `<path d="M25 332 98 236l62 96M21 370c80-32 140 32 215 0s116 0 176-5" ${stroke}/><path d="M195 173h178v132H195zm-22 0 111-76 111 76M210 305v61m151-61v48m-126-98v-54h49v54" ${stroke}/><rect x="306" y="201" width="40" height="54" fill="${O}"/><path d="M103 221V61m-42 51 42-51 43 51m-84 46 41-49 41 49" ${stroke}/>` ,
  winter: snow + `<path d="M43 314V195q0-37 37-37h204q37 0 37 37v119H43Zm280-8h62l19 12" ${stroke}/><rect x="72" y="187" width="80" height="66" rx="5" fill="${O}"/><path d="M192 312V186h69v126" ${stroke}/><circle cx="111" cy="321" r="28" fill="${D}" stroke="${C}" stroke-width="7"/>`,
};
const cards = [
  ['uteguiden', ['Kunnskap som', 'holder deg varm'], 'Kulde, varme og livet ute', 'overview'],
  ['julegaven-til-den-som-har-alt', ['Til den som', 'har alt'], 'Om julegaver og omtanke', 'christmas'],
  ['hvordan-forlenge-terassesesongen', ['En lengre', 'terrassesesong'], 'Komfort ute gjennom året', 'terrace'],
  ['cloudweave', ['Luften som', 'holder på varmen'], 'CloudWeave™ og isolasjon', 'cloud'],
  ['hva-skal-man-ha-innerst', ['Hva skal du', 'ha innerst?'], 'Ull, fukt og lag-på-lag', 'layers'],
  ['hvordan-holde-varmen-ute', ['Hold varmen.', 'Bli litt lenger.'], 'Bekledning og komfort ute', 'warm'],
  ['hvorfor-blir-man-kald', ['Hvorfor blir', 'vi kalde?'], 'Kroppens varmetap forklart', 'cold'],
  ['ykk', ['Den lille delen', 'som holder alt', 'sammen'], 'Glidelåsens mekanikk og vedlikehold', 'zipper'],
  ['hva-er-glamping', ['Hva er', 'glamping?'], 'Fra luksustelt til naturopplevelse', 'glamping'],
  ['glamping-i-norge', ['Glamping', 'i Norge'], 'Dette bør du sjekke og pakke', 'norway'],
  ['vinterlagring-av-campingvogn-og-bobil', ['Klar for', 'vinterlagring?'], 'Campingvogn og bobil', 'winter'],
];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  fs.mkdirSync('public/images/uteguiden/social', { recursive: true });
  for (const [slug, lines, subtitle, motif] of cards) {
    await page.setContent(`<!doctype html><html lang="nb"><head><meta charset="utf-8"><style>
      @font-face{font-family:Utekos;src:url(data:font/woff2;base64,${font});font-weight:100 1000}
      *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:${D};color:${C};font-family:Utekos;font-optical-sizing:none;font-variation-settings:'opsz' 120}
      .logo{position:absolute;left:64px;top:47px;width:174px;height:auto}.label{position:absolute;left:65px;top:134px;font-size:24px;font-weight:500;margin:0}
      .rule{position:absolute;left:65px;top:189px;width:64px;height:7px;background:${O}}
      h1{position:absolute;left:60px;top:219px;margin:0;font-size:68px;line-height:1.06;letter-spacing:-2px;font-weight:800}
      .subtitle{position:absolute;left:64px;bottom:56px;font-weight:500;font-size:25px;margin:0}
      .art{position:absolute;right:40px;top:95px;width:445px;height:445px;background:#012622;border-radius:50%}
      .foot{position:absolute;right:72px;bottom:57px;font-size:19px;font-weight:500;margin:0}
    </style></head><body>
    <img class="logo" alt="Utekos" src="data:image/svg+xml;base64,${logo}"><p class="label">Uteguiden</p><div class="rule"></div>
    <h1>${lines.join('<br>')}</h1><p class="subtitle">${subtitle}</p>
    <div class="art"><svg width="445" height="445" viewBox="0 0 440 440" aria-hidden="true">${motifs[motif]}</svg></div><p class="foot">utekos.no/uteguiden</p>
    </body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const bounds = await page.locator('h1').boundingBox();
    if (bounds.x + bounds.width > 710 || bounds.y + bounds.height > 528) throw new Error(`Title overlaps illustration or subtitle: ${slug}`);
    const output = `public/images/uteguiden/social/${slug}-${version}.png`;
    const bytes = await page.screenshot();
    if (fs.existsSync(output) && !fs.readFileSync(output).equals(bytes)) {
      throw new Error(`Refusing to change a versioned URL: ${output}. Set a new SEO_IMAGE_VERSION and update registry URLs.`);
    }
    if (!fs.existsSync(output)) fs.writeFileSync(output, bytes);
    console.log(slug);
  }
} finally { await browser.close(); }
