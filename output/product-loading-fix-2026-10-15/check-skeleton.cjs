const {chromium}=require('playwright');const fs=require('fs');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch();const results=[];for(const [name,width,height] of [['desktop',1440,1000],['ipad',820,1180],['mobile',390,844]]){
 const p=await b.newPage({viewport:{width,height},javaScriptEnabled:false});await p.route('**/*',r=>new URL(r.request().url()).origin==='http://localhost:3001'?r.continue():r.abort());
 await p.goto('http://localhost:3001/produkter/utekos-mikrofiber?farge=fjellbla&storrelse=large');
 const state=await p.evaluate(()=>({busy:!!document.querySelector('main[aria-busy="true"]'),footerY:document.querySelector('footer').getBoundingClientRect().y,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth}));
 assert(state.busy);assert(state.footerY>=height);assert(!state.overflow);
 await p.screenshot({path:`${__dirname}/${name}-skeleton.png`});results.push({name,...state});await p.close();
}fs.writeFileSync(`${__dirname}/skeleton-verification.json`,JSON.stringify(results,null,2));await b.close();console.log(results)})().catch(e=>{console.error(e);process.exit(1)});
