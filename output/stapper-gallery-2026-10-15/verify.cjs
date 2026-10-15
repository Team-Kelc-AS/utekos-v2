const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{const b=await chromium.launch();const results=[];for(const [name,width,height] of [['mobile',390,844],['ipad',820,1180],['desktop',1440,1000]]){
 const page=await b.newPage({viewport:{width,height},reducedMotion:'reduce'});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin!=='http://localhost:3000'||/^\/(?:__sgtm|api\/(?:events|meta|log|observability))/.test(u.pathname)?r.abort():r.continue()});
 const response=await page.goto('http://localhost:3000/produkter/utekos-stapper',{waitUntil:'load'});assert.equal(response.status(),200);
 const gallery=page.locator('[data-gallery-product]');await gallery.waitFor();const imgs=gallery.locator('figure img');assert.equal(await imgs.count(),2);
 const data=[];for(let i=0;i<2;i++){await imgs.nth(i).scrollIntoViewIfNeeded();await imgs.nth(i).evaluate(img=>img.decode());data.push(await imgs.nth(i).evaluate(img=>({src:decodeURIComponent(img.currentSrc),alt:img.alt,width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height})));}
 const dimension=width<768?'1000x1500':'1440x1800';assert(data[0].src.includes(`Stapper_${dimension}_White.webp`));assert(data[1].src.includes(`Stapper_${dimension}_Orange.webp`));for(const image of data)assert(Math.abs(image.width/image.height-(width<768?2/3:4/5))<.002);
 await imgs.first().scrollIntoViewIfNeeded();await page.screenshot({path:`${__dirname}/${name}.png`});results.push({name,data});await page.close();
}await b.close();fs.writeFileSync(`${__dirname}/verification.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});
