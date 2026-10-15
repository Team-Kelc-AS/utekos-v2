const { chromium } = require('playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
const origin='http://localhost:3001';
const route='/produkter/utekos-mikrofiber?farge=fjellbla&storrelse=large';
(async()=>{
 const browser=await chromium.launch(); const results=[];
 for(const [name,width,height] of [['desktop',1440,1000],['ipad',820,1180],['mobile',390,844]]) {
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,reducedMotion:'reduce'});
  const page=await context.newPage(); const errors=[]; const requests=[];
  page.on('pageerror',e=>errors.push(String(e))); page.on('request',r=>requests.push({type:r.resourceType(),url:r.url()}));
  await page.route('**/*',r=>{ const u=new URL(r.request().url());return u.origin!==origin||/^\/(?:__sgtm|api\/(?:events|meta|log|observability))/.test(u.pathname)?r.abort():r.continue(); });
  await page.goto(origin+route); await page.locator('h1').waitFor(); await page.evaluate(()=>document.fonts.ready);
  const before=requests.filter(r=>r.type==='script').map(r=>r.url);
  const fonts=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/woff/.test(r.name)).map(r=>({url:r.name,bytes:r.encodedBodySize})));
  assert.equal(fonts.length,1); assert.equal(fonts[0].bytes,61684);
  const button=page.getByRole('button',{name:'Størrelsesguide',exact:true});
  const tracking=await button.getAttribute('data-track-data');assert.equal(JSON.parse(tracking).product_handle,'utekos-mikrofiber');
  await button.focus(); await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Størrelsesguide'});await dialog.waitFor();
  assert(await dialog.locator('table').count());
  assert(await dialog.evaluate(el=>el.contains(document.activeElement)));
  await page.screenshot({path:`${__dirname}/${name}-dialog.png`});
  await page.keyboard.press('Escape'); await dialog.waitFor({state:'hidden'});
  await page.waitForTimeout(150); assert(await button.evaluate(el=>el===document.activeElement));
  await button.click();await dialog.waitFor();await dialog.getByRole('button',{name:'Lukk',exact:true}).last().click();await dialog.waitFor({state:'hidden'});await page.waitForTimeout(150);
  assert(await button.evaluate(el=>el===document.activeElement));
  const after=requests.filter(r=>r.type==='script'&&!before.includes(r.url));assert(after.length>0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!overflow);
  await page.screenshot({path:`${__dirname}/${name}-page.png`});
  // A supported character outside the Latin subset must still load the complete face.
  const rare=await page.evaluate(async()=>{const p=document.createElement('p');p.style.fontFamily='var(--font-google-sans-flex)';p.textContent='Ł';document.body.append(p);await document.fonts.load('500 16px '+getComputedStyle(p).fontFamily,'Ł');return performance.getEntriesByType('resource').filter(r=>/woff/.test(r.name)).map(r=>r.encodedBodySize)});
  assert(rare.includes(88832));assert.equal(errors.length,0,errors.join('\n'));
  results.push({name,fonts,lazyScripts:after,focusRestored:true,keyboardAndClose:true,overflow,rareGlyphFontLoaded:true,errors});await context.close();
 }
 fs.writeFileSync(`${__dirname}/verification.json`,JSON.stringify(results,null,2));await browser.close();console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
