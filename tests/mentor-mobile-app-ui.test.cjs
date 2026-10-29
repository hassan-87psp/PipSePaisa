'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('psp-mentor.html');
const css=read('mentor-mobile-ui-v1.css');
const js=read('mentor-mobile-ui-v1.js');

test('Mobile shell files are linked on Mentor only and keep desktop invisible',()=>{
 assert.match(html,/href="\/mentor-mobile-ui-v1\.css\?v=20261030-v1"/);
 assert.match(html,/src="\/mentor-mobile-ui-v1\.js\?v=20261030-v1"/);
 assert.ok(html.includes('id="sidebar"'));
 assert.ok(html.includes('id="navMenu"'));
 assert.ok(html.includes('id="pages"'));
 assert.ok(html.includes('id="mDrawer"'));
 assert.ok(css.includes('#mentorMobileBottomNav { display:none; }'));
 assert.ok(css.includes('@media screen and (max-width:700px)'));
 assert.ok(css.includes('.app.show #mentorMobileBottomNav'));
 assert.ok(css.includes('.app.show > #sidebar { display:none!important; }'));
 assert.ok(css.includes('grid-template-columns:repeat(5,minmax(0,1fr))'));
 assert.ok(!read('admin/index.html').includes('mentor-mobile-ui-v1'));
 assert.ok(!read('dashboard/index.html').includes('mentor-mobile-ui-v1'));
});

test('Working Home, Signals, Charts, Articles and More mobile destinations remain wired',()=>{
 for(const [key,name] of [
  ['performance','Home'],['signals','Signals'],['charts','Charts'],
  ['articles','Articles'],['more','More']
 ]){
  assert.ok(js.includes("key:'"+key+"'"),key);
  assert.ok(js.includes("name:'"+name+"'"),name);
 }
 assert.ok(js.includes('window.showPage(key)'));
 assert.ok(js.includes('window.mDrawerOpen?.()')||js.includes("window.mDrawerOpen==='function'"));
 assert.ok(js.includes("btn.setAttribute('aria-current','page')"));
 assert.ok(js.includes('MutationObserver'));
 assert.ok(js.includes("e.stopImmediatePropagation()"));
 assert.ok(js.includes('window.mDrawerClose?.()'));
 assert.ok(html.includes('id="pspPortalInstallDrawerNav"'),'Install App still in More');
 assert.ok(html.includes("function mDrawerGo(k){mDrawerClose();showPage(k);}"));
});

test('Touch, keyboard, table overflow, charts and performance have mobile-specific fixes',()=>{
 for(const part of [
  'env(safe-area-inset-bottom','env(safe-area-inset-top',
  'body.pspm-keyboard-open','.pspm-table-scroll',
  'input[type="checkbox"]','input[type="radio"]',
  '#pg-performance #perfResults .sigdash',
  '.psp-rh-modal.open','#mDrawer.open'
 ])assert.ok(css.includes(part),part);
 assert.ok(js.includes('wrapWideTables()'));
 assert.ok(js.includes('aria-label'));
 assert.ok(js.includes('syncKeyboard()'));
 assert.ok(js.includes("if(!btn||!mobile())return;"));
 assert.ok(!/\.auth\.|\.rpc\(|\.from\(|signOut\(/.test(js),'UI must not alter backend/auth');
});

test('Mobile navigation script passes Node syntax verification',()=>{
 assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',path.join(root,'mentor-mobile-ui-v1.js')],{stdio:'pipe'}));
});
