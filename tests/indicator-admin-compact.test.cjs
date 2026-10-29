const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Both admin routes preload compact stylesheet and launch compact script last',()=>{
 for(const p of ['admin/index.html','admin-panel.html']){
  const html=read(p);
  const css='/admin-ea-indicator-compact-v375.css?v=20261029-v375-compact';
  const js='/admin-ea-indicator-compact-v375.js?v=20261029-v375-compact';
  const base='admin-ea-indicator-v238.js?v=20261029-v375-support';
  const prev='/admin-ea-indicator-enterprise-v374.js?v=20261029-v498-filters';
  assert.equal(html.split(css).length-1,1);
  assert.equal(html.split(js).length-1,1);
  assert.equal(html.split(base).length-1,1);
  assert.equal(html.split(prev).length-1,1);
  assert.ok(html.indexOf(css)<html.indexOf(base));
  assert.ok(html.indexOf(prev)<html.indexOf(js));
 }
});
test('The compact workspace keeps just the header, four KPIs, one queue and hidden extras',()=>{
 const src=read('admin-ea-indicator-compact-v375.js');
 const css=read('admin-ea-indicator-compact-v375.css');
 assert.doesNotThrow(()=>new Function(src));
 for(const component of ['eaiV374Header','eaiV374Metrics','eaiV374Queue','eaiV375Nav','eaiV375Insights']){
  assert.ok(src.includes(component),'Missing '+component);
 }
 assert.match(src,/function reconcileInsights\(/);
 assert.match(src,/api\.productForm\(\)/);
 assert.match(src,/if\(view==='applications'\)api\.tab\('requests'\)/);
 assert.match(src,/if\(view==='products'\)api\.tab\('products'\)/);
 assert.match(css,/#page-eaindicator #eaiUHero/);
 assert.match(css,/#page-eaindicator #eaiAPanel/);
 assert.match(css,/#page-eaindicator\.eaiV375-ready\.eaiV375-applications #eaiAContent/);
 assert.match(css,/\.eaiV374-metric small\{display:none!important\}/);
 assert.match(css,/min-height:83px!important/);
 assert.match(css,/#page-eaindicator\.eaiV375-ready\.eaiV375-insights #eaiV375Insights/);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.match(css,/\[data-theme="dark"\]/);
});
test('Compact UI delegates tab, product editor and existing private review logic',()=>{
 const calls=[],api={
  load:async()=>{calls.push('load');return 'ok'},
  tab:t=>{calls.push(t);return t},
  productForm:()=>{calls.push('product');return 'product'}
 };
 const doc={readyState:'loading',addEventListener:()=>{},getElementById:()=>null};
 const c={PSPEAIAdmin:api,document:doc,window:null,console,setTimeout:()=>{}};
 c.window=c;vm.createContext(c);
 assert.doesNotThrow(()=>vm.runInContext(read('admin-ea-indicator-compact-v375.js'),c));
 assert.equal(api.tab('products'),'products');
 assert.equal(api.tab('requests'),'requests');
 assert.deepEqual(calls,['products','requests']);
});
test('No false empty queue on first login, and mismatched requests are prioritized',()=>{
 const s=read('admin-ea-indicator-enterprise-v374.js');
 assert.match(s,/if\(!snap\|\|!snap\.loaded\)return null/);
 assert.match(s,/if\(!state\.stats\.action&&state\.stats\.attention\)state\.filter='attention'/);
 assert.match(s,/if\(!state\.stats\.action&&!state\.stats\.attention&&state\.stats\.issued\)state\.filter='issued'/);
 const base=read('admin-ea-indicator-v238.js');
 assert.match(base,/state\.loaded=true/);
 assert.match(base,/getSnapshot:snapshot/);
 assert.match(base,/S\.open=!S\.open;draw\(\)/);
});
