const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{const b=await chromium.launch();const results=[];for(const product of ['utekos-dun','utekos-mikrofiber'])for(const [name,width,height] of [['mobile',390,844],['ipad',820,1180],['desktop',1440,1000]]){
 const page=await b.newPage({viewport:{width,height},reducedMotion:'reduce'});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin!=='http://localhost:3000'||/^\/(?:__sgtm|api\/(?:events|meta|log|observability))/.test(u.pathname)?r.abort():r.continue()});
 const response=await page.goto(`http://localhost:3000/produkter/${product}?farge=vargnatt`,{waitUntil:'load'});assert.equal(response.status(),200);
 const img=page.locator('[data-gallery-product] figure img').first();await img.waitFor();await img.evaluate(img=>img.decode());
 const data=await img.evaluate(img=>{const p=img.closest('picture'),r=p.getBoundingClientRect(),i=img.getBoundingClientRect();return {src:decodeURIComponent(img.currentSrc),frame:{width:r.width,height:r.height},image:{width:i.width,height:i.height},objectFit:getComputedStyle(img).objectFit,originalWidth:img.width,originalHeight:img.height,figures:img.closest('[data-gallery-product]').querySelectorAll('figure').length}});
 assert(data.src.includes('Black_Mikrofiber_Full.webp'));assert(Math.abs(data.frame.width/data.frame.height-(width<768?2/3:4/5))<.002);if(width>=768)assert.equal(data.objectFit,'contain');
 await page.screenshot({path:`${__dirname}/${product}-${name}.png`});results.push({product,name,...data});await page.close();
}await b.close();fs.writeFileSync(`${__dirname}/verification.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});
