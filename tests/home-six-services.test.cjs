'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'psp-services-six-v1.css'),'utf8');
const section=home.match(/<section class="section services-premium services-banner-section"[\s\S]*?<\/section>/)?.[0]||'';
test('Six service banners in requested order with meaningful internal destinations',()=>{
 const expected=[['Forex Courses','/courses/'],['VIP Signals','/signals/'],['P+ Indicators','/eaindicator/'],['Trading Tools','/tradingtools/'],['Broker Insights','/broker-reviews/'],['Our Partners','/becomepartner/']];
 const cards=[...section.matchAll(/<a aria-label="Explore ([^"]+)" class="service-banner-card psp-six-card[^"]*" href="([^"]+)"/g)];
 assert.equal(cards.length,6);
 cards.forEach((m,i)=>assert.deepEqual([m[1],m[2]],expected[i]));
 assert.ok(section.includes('Introducing Broker (IB)'));
 assert.ok(!section.includes("openLandingAuth('login');return false"),'cards navigate to services');
});
test('Desktop 3 columns, tablet 2, mobile 1 and both themes are handled',()=>{
 assert.ok(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert.ok(css.includes('grid-template-columns:1fr!important'));
 assert.ok(css.includes('body.dark-theme'));
 assert.ok(css.includes('focus-visible'));
 assert.ok(home.includes('/psp-services-six-v1.css?v=20261030-v1'));
});
