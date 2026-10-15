const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('fs');
const blue=[1,2,3,4].map(n=>`Soveposejakke_Blue${n}.webp`),black=[1,2,3,4].map(n=>`Soveposejakke_Black${n}.webp`);
const lifestyle=['mikrofiber_vargnatt_45_jarle_2.webp','mikrofiber_vargnatt_45_2.webp','mikrofiber_vargnatt_45_3.webp','Mikrofiber_Vargnatt_1440x1800_Full2.webp'];
(async()=>{const b=await chromium.launch();const results=[];for(const color of ['fjellbla','vargnatt'])for(const [name,width,height] of [['mobile',390,844],['ipad',820,1180],['desktop',1440,1000]]){
 const p=await b.newPage({viewport:{width,height},reducedMotion:'reduce'});await p.route('**/*',r=>{const u=new URL(r.request().url());return u.origin!=='http://localhost:3000'||/^\/(?:__sgtm|api\/(?:events|meta|log|observability))/.test(u.pathname)?r.abort():r.continue()});
 await p.goto(`http://localhost:3000/produkter/utekos-mikrofiber?farge=${color}`);const figures=p.locator('[data-gallery-product] figure:visible');await figures.first().waitFor();
 const expected=color==='vargnatt'?(width<768?black:[...lifestyle,...black]):(width<768?null:[...blue,'Mikrofiber_44.webp']);
 const count=await figures.count();assert.equal(count,expected?.length??8);const data=[];
 for(let i=0;i<count;i++){const f=figures.nth(i);await f.scrollIntoViewIfNeeded();const im=f.locator('img');await im.evaluate(i=>i.decode());const row=await im.evaluate(img=>{const r=img.closest('picture').getBoundingClientRect();const u=new URL(img.currentSrc);return {src:u.searchParams.get('url')||img.currentSrc,width:r.width,height:r.height,fit:getComputedStyle(img).objectFit}});data.push(row);if(expected)assert(row.src.includes(expected[i]),JSON.stringify({color,name,i,row,expected}));else if(i>=4)assert(row.src.includes(blue[i-4]));
 if(width>=768){assert(Math.abs(row.width/row.height-.8)<.002);if(row.src.includes('Soveposejakke'))assert.equal(row.fit,'contain');}
 if(i===(color==='vargnatt'&&width>=768?4:color==='fjellbla'&&width<768?4:0))await f.screenshot({path:`${__dirname}/${color}-${name}-studio.png`});
 }
 results.push({color,name,count,data});await p.close();
}await b.close();fs.writeFileSync(`${__dirname}/verification.json`,JSON.stringify(results,null,2));console.log(results.map(({color,name,count})=>({color,name,count})));})().catch(e=>{console.error(e);process.exit(1)});
