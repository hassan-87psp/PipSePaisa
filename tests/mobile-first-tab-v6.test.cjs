'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const router=fs.readFileSync(path.join(__dirname,'..','psp-v28-fixes.js'),'utf8');
const from=router.indexOf('function intended(){');
const until=router.indexOf('function rememberTarget(',from);
assert.ok(from>0&&until>from,'intended() route function is present');
const intendedSource=router.slice(from,until);

function resolveInitial({pathname='/dashboard',search='',hash='',mobile=true,first=true}={}){
  const location={pathname,search,hash};
  const window={matchMedia:()=>({matches:mobile})};
  const source=[
    "const PATH_TO_PAGE={'/dashboard':'dashboard','/signals':'signals'};",
    "function normalizePath(){const p=location.pathname||'/';return p.endsWith('/')?(p.slice(0,-1)||'/'):p;}",
    "let pspV6FirstRoutePending=first;",
    intendedSource,
    "return intended();"
  ].join('\n');
  const run=new Function('location','window','URLSearchParams','first',source);
  return run(location,window,URLSearchParams,first);
}

test('Normal first mobile dashboard entry opens Signals, including login redirect',()=>{
  assert.equal(resolveInitial(), 'signals');
  assert.equal(resolveInitial({search:'?logged_in=1'}),'signals');
});
test('Desktop stays Dashboard and explicit Home/Back remains Dashboard',()=>{
  assert.equal(resolveInitial({mobile:false}),'dashboard');
  assert.equal(resolveInitial({first:false}),'dashboard');
  assert.equal(resolveInitial({search:'?page=dashboard'}),'dashboard');
});
test('Exact item notification destinations and payment returns retain precedence',()=>{
  assert.equal(resolveInitial({search:'?page=signals&signal_id=abc'}),'signals');
  assert.equal(resolveInitial({search:'?page=articles&chart_id=abc'}),'articles');
  assert.equal(resolveInitial({search:'?page=articles&article_id=abc'}),'articles');
  assert.equal(resolveInitial({search:'?page=newshub&news_url=abc'}),'newshub');
  assert.equal(resolveInitial({search:'?payment=return'}),'dashboard');
});
test('Direct Signals page stays Signals and a hash prevents default override',()=>{
  assert.equal(resolveInitial({pathname:'/signals'}),'signals');
  assert.equal(resolveInitial({hash:'#journal'}),'dashboard');
});
