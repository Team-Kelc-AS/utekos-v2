const {chromium}=require('playwright');const fs=require('fs');const assert=require('node:assert/strict');
const products=JSON.parse(fs.readFileSync('/tmp/utekos-cart-suggestions.json')).products;
const money=amount=>({amount:String(amount),currencyCode:'NOK'});
const line=(handle,amount,variantId='fixture-variant')=>({id:`fixture-${handle}`,variantId,quantity:1,title:handle==='comfyrobe'?'Comfyrobe™':handle==='utekos-stapper'?'Utekos Stapper™':'Utekos Mikrofiber™',handle,variantTitle:'Testvariant',available:true,image:null,total:money(amount),commerce:null});
(async()=>{const browser=await chromium.launch();const results=[];
for(const [profile,width,height] of [['mobile',390,844],['desktop',1440,1000]])for(const scenario of ['comfy','upsell','variant','failure']){
 const p=await browser.newPage({viewport:{width,height}});const calls=[];let lines=[scenario==='variant'?line('utekos-stapper',199):scenario==='comfy'?line('comfyrobe',845):line('utekos-mikrofiber',1790)];let codes=[];
 const cart=()=>{const total=lines.reduce((sum,l)=>sum+Number(l.total.amount),0);return {id:null,checkout:null,commerce:null,totalQuantity:lines.length,lines,subtotal:money(total),total:money(total),discountCodes:codes,requiresStandardCheckout:codes.some(c=>c.applicable)}};
 await p.addInitScript(()=>{window.Klarna={Payments:{Buttons:{init:()=>({load:(options,ready)=>{const b=document.createElement('button');b.textContent='Klarna Express (test)';document.querySelector(options.container).append(b);ready({show_form:true});}})}}};});
 await p.route('**/*',r=>{const u=new URL(r.request().url());const json=(data,status=200)=>r.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(u.pathname==='/api/cart/suggestions')return scenario==='failure'?json({error:'Test'},502):json({products});
  if(u.pathname==='/api/cart'){
   if(r.request().method()==='POST'){const op=r.request().postDataJSON();calls.push(op);const product=products.find(p=>p.handle===op.handle);const v=product.variants.find(v=>v.id===op.variantId);lines.push(line(product.handle,v.price.amount,v.id));}
   return json({cart:cart(),warnings:[]});
  }
  if(u.pathname==='/api/cart/discount'){const {code}=r.request().postDataJSON();calls.push({code});codes=[{code,applicable:true}];return json({cart:cart(),warnings:[]});}
  if(u.pathname==='/api/klarna/client-config')return json({client_id:'klarna_live_client_fixture',environment:'playground'});
  if(u.pathname==='/api/klarna/orders'||u.pathname==='/api/klarna/prepare')throw new Error('Payments not allowed');
  if(u.origin==='http://localhost:3000'&&!/^\/(?:__sgtm|api\/(?:events|meta|log|observability))/.test(u.pathname)||u.hostname==='cdn.shopify.com')return r.continue();return r.abort();
 });
 await p.goto('http://localhost:3000/produkter/utekos-stapper');await p.waitForTimeout(1000);await p.getByRole('button',{name:/Åpne handlekurv/}).click();const d=p.getByRole('dialog',{name:'Handlekurven din'});await d.waitFor();await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 const section=d.getByRole('region',{name:'Frakt og tilbehør'});await section.waitFor();
 if(scenario==='comfy'){
  await section.getByRole('button',{name:'Bruk COMFYFRI'}).click();await section.getByText('Gratulerer, du har gratis frakt!').waitFor();assert.equal(calls[0].code,'COMFYFRI');assert.equal(await d.getByRole('button',{name:'Klarna Express (test)',exact:true}).count(),0);
 }else if(scenario==='upsell'){
  const button=section.getByRole('button',{name:'Legg til Utekos Stapper™'});await button.waitFor();await button.scrollIntoViewIfNeeded();await p.screenshot({path:`${__dirname}/${profile}-upsell-before.png`});await button.click();await section.getByText('Fullfør din Utekos – 10 % på tilbehør!',{exact:true}).waitFor();assert.equal(calls[0].variantId,products.find(p=>p.handle==='utekos-stapper').variants[0].id);assert.equal(await section.getByRole('button',{name:'Legg til Utekos Stapper™'}).count(),0);assert.equal(await section.getByRole('button',{name:/TILBEHØR10/}).count(),0);assert.equal(calls.length,1);
 }else if(scenario==='variant'){
  const select=section.getByLabel('Velg variant');await select.waitFor();const desired=products.find(p=>p.handle==='comfyrobe').variants.at(-1);await select.selectOption(desired.id);await section.getByRole('button',{name:/Legg til Comfyrobe/}).click();assert.equal(calls[0].variantId,desired.id);
 }else {await section.getByText('Gratulerer, du har gratis frakt!').waitFor();assert.equal(await d.getByRole('button',{name:'Til kassen',exact:true}).isEnabled(),true);}
 await section.scrollIntoViewIfNeeded();await p.screenshot({path:`${__dirname}/${profile}-${scenario}.png`});assert.equal(await d.evaluate(el=>el.scrollWidth<=el.clientWidth),true);results.push({profile,scenario,passed:true});await p.close();
}await browser.close();fs.writeFileSync(`${__dirname}/verification.json`,JSON.stringify(results,null,2));console.log(results)})().catch(e=>{console.error(e);process.exit(1)});
