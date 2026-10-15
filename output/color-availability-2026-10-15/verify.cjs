const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{const browser=await chromium.launch();const results=[];for(const [profile,width,height] of [['mobile',390,844],['desktop',1440,1000]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin!=='http://localhost:3000'||/^\/(?:__sgtm|api\/(?:events|meta|log|observability))/.test(u.pathname)?r.abort():r.continue()});
 await page.goto('http://localhost:3000/produkter/utekos-mikrofiber?farge=vargnatt&storrelse=medium');
 const blue=page.locator('a[data-variant]').filter({hasText:'Fjellblå'});await blue.waitFor();
 const before=await blue.evaluate(a=>({available:a.dataset.available,href:a.getAttribute('href'),strike:getComputedStyle(a,'::after').content,text:a.textContent}));
 assert.equal(before.available,'true');assert.equal(before.strike,'none');assert(before.href.includes('storrelse=large'));
 await blue.click();await page.waitForURL('**farge=fjellbla&storrelse=large');
 await page.locator('a[data-variant][aria-current="true"]').filter({hasText:'Large'}).waitFor();
 const medium=page.locator('a[data-variant]').filter({hasText:'Medium'});assert.equal(await medium.getAttribute('data-available'),'false');
 assert.equal(await page.locator('a[data-variant]').filter({hasText:'Large'}).getAttribute('data-available'),'true');
 await page.screenshot({path:`${__dirname}/${profile}-after.png`});results.push({profile,before,after:page.url(),mediumUnavailable:true,largeAvailable:true});await page.close();
}await browser.close();fs.writeFileSync(`${__dirname}/verification.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});
