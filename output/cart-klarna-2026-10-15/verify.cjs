const {chromium}=require('playwright');
const fs=require('fs');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();const results=[];
 for(const [profile,width,height] of [['mobile',390,844],['ipad',820,1180],['desktop',1440,1000]]) {
  const p=await browser.newPage({viewport:{width,height}});const calls=[];
  const money={amount:'3580',currencyCode:'NOK'};
  const cart={id:null,checkout:null,commerce:null,totalQuantity:2,lines:[{id:'fixture-line',variantId:'gid://shopify/ProductVariant/1',quantity:2,title:'Utekos Mikrofiber™',handle:'utekos-mikrofiber',variantTitle:'Large / Fjellblå',available:true,image:null,total:money,commerce:null}],subtotal:money,total:money};
  await p.addInitScript(()=>{window.fixtureAuthorizations=[];window.Klarna={Payments:{Buttons:{init:()=>({load:(opts,ready)=>{const b=document.createElement('button');b.textContent='Klarna Express (test)';b.onclick=()=>opts.on_click((options,payload,done)=>{window.fixtureAuthorizations.push({options,payload});window.fixtureCancel=()=>done({approved:false});});document.querySelector(opts.container).append(b);ready({show_form:true});}})}}};});
  await p.route('**/*',r=>{
   const u=new URL(r.request().url());const json=data=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
   if(u.pathname==='/api/cart')return json({cart,warnings:[]});
   if(u.pathname==='/api/klarna/client-config')return json({client_id:'klarna_live_client_fixture',environment:'playground'});
   if(u.pathname==='/api/klarna/prepare'){calls.push(r.request().postDataJSON());return json({cart,warnings:[],shopifyCartId:'fixture',orderPayload:{order_amount:358000,order_lines:[{quantity:2}]}});}
   if(u.pathname==='/api/cart/checkout'){calls.push(r.request().postDataJSON());return json({checkoutUrl:'https://example.test'});}
   if(u.pathname==='/api/klarna/orders')throw new Error('No orders allowed');
   return u.origin!=='http://localhost:3000'||/^\/(?:__sgtm|api\/(?:events|meta|log|observability))/.test(u.pathname)?r.abort():r.continue();
  });
  await p.goto('http://localhost:3000/produkter/utekos-stapper');await p.waitForTimeout(1000);await p.getByRole('button',{name:/Åpne handlekurv/}).click();
  const d=p.getByRole('dialog',{name:'Handlekurven din'});await d.waitFor();await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  const express=d.getByRole('button',{name:'Klarna Express (test)',exact:true});await express.waitFor();await express.scrollIntoViewIfNeeded();
  const box=await express.boundingBox();assert(box.width>250);assert(box.x>=0&&box.x+box.width<=width);
  await p.screenshot({path:`${__dirname}/${profile}.png`});await express.click();await p.waitForFunction(()=>window.fixtureAuthorizations.length===1);
  assert.deepEqual(calls[0],{scope:'cart'});assert.equal(calls[1].method,'klarna');
  assert.equal(await d.getByRole('button',{name:'Oppdaterer …',exact:true}).isDisabled(),true);
  assert.equal(await p.evaluate(()=>window.fixtureAuthorizations[0].payload.order_lines[0].quantity),2);
  await p.evaluate(()=>window.fixtureCancel());await d.getByRole('button',{name:'Til kassen',exact:true}).waitFor();
  assert.equal(await d.getByRole('button',{name:'Til kassen',exact:true}).isEnabled(),true);
  await d.getByRole('button',{name:'Lukk',exact:true}).click();await p.getByRole('button',{name:/Åpne handlekurv/}).click();await d.getByRole('button',{name:'Klarna Express (test)',exact:true}).waitFor();
  results.push({profile,width:box.width,cartOnly:true,quantity:2,cancellationUnlocks:true,reopens:true});await p.close();
 }
 await browser.close();fs.writeFileSync(`${__dirname}/verification.json`,JSON.stringify(results,null,2));console.log(results);
})().catch(e=>{console.error(e);process.exit(1)});
