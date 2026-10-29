'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=p=>JSON.parse(read(p));

test('User, Mentor and Admin have different install identities, names, start pages and scopes',()=>{
 const entries=[
  ['manifest.json','/','/dashboard/','PSP USER'],
  ['mentor-manifest.json','/psp-mentor.html','/psp-mentor.html','PSP MENTOR'],
  ['admin-manifest.json','/admin/','/admin/','PSP ADMIN']
 ];
 const ids=new Set();
 for(const [file,id,start,name] of entries){
  const m=load(file);
  assert.equal(m.id,id,file+' id');
  assert.equal(m.start_url,start,file+' start');
  assert.equal(m.short_name,name,file+' label');
  assert.equal(m.display,'standalone',file+' display');
  assert.ok(m.start_url.startsWith(m.scope),file+' start must stay inside scope');
  assert.equal(ids.has(id),false,file+' must be unique');
  ids.add(id);
  assert.ok(m.icons.some(icon=>icon.sizes==='192x192'));
  assert.ok(m.icons.some(icon=>icon.sizes==='512x512'));
 }
 assert.equal(load('manifest.json').scope,'/','keep existing user app identity and scope');
 assert.notEqual(load('mentor-manifest.json').scope,'/','mentor should have its own narrow scope');
 assert.notEqual(load('admin-manifest.json').scope,'/','admin should have its own narrow scope');
});

test('Each portal advertises its own install manifest and registers its own service worker scope',()=>{
 const portals=[
  ['dashboard/index.html','/manifest.json',null],
  ['psp-mentor.html','/mentor-manifest.json','/psp-mentor.html'],
  ['admin/index.html','/admin-manifest.json','/admin/'],
  ['admin-panel.html','/admin-manifest.json','/admin/']
 ];
 for(const [file,manifest,scope] of portals){
  const html=read(file);
  assert.ok(html.includes('rel="manifest" href="'+manifest+'"'),file+' manifest');
  if(scope){
   assert.ok(html.includes("serviceWorker.register('/pwa-sw.js',{scope:'"+scope+"'"),file+' scoped worker');
   assert.ok(html.includes('apple-mobile-web-app-title'),file+' Apple label');
  }
 }
});

test('Three logins use separate Supabase storage keys, so logging out in one does not delete the others',()=>{
 const sources=[
  ['user-app-core-v29.js','pipsepaisa-user-auth-v2'],
  ['psp-mentor.html','pipsepaisa-mentor-auth-v2'],
  ['admin-core-v406.js','pipsepaisa-admin-auth-v2']
 ];
 const names=[];
 for(const [file,key] of sources){
  assert.ok(read(file).includes('storageKey:'+JSON.stringify(key)),file+' must explicitly scope the session');
  names.push(key);
 }
 assert.equal(new Set(names).size,3);
});

test('Logging out in any portal revokes only its own session, never the other installed apps',()=>{
 const cases=[
  ['user-app-core-v29.js',1],
  ['psp-mentor.html',2],
  ['admin-core-v406.js',2]
 ];
 for(const [file,count] of cases){
  const src=read(file);
  assert.equal(src.split("await sb.auth.signOut({scope:'local'});").length-1,count,file+' local signout count');
  assert.ok(!src.includes('await sb.auth.signOut();'),file+' must not do global signout');
 }
});

test('Admin and Mentor sidebars expose Install App with the correct action',()=>{
 for(const page of ['admin/index.html','admin-panel.html','psp-mentor.html']){
  const html=read(page);
  assert.ok(html.includes('id="pspPortalInstallNav"'),page+' installs from sidebar');
  assert.ok(html.includes('onclick="pspPortalInstall()"'),page+' activates installer');
  assert.ok(html.includes('data-psp-install-label'),page+' has install state label');
  assert.ok(html.includes('data-psp-install-badge'),page+' has install badge');
  assert.ok(html.includes('src="/portal-install-v1.js?v=20261030-v1"'),page+' loads installer');
  assert.equal(html.split('id="pspPortalInstallNav"').length-1,1,page+' has one sidebar install item');
 }
 const mentor=read('psp-mentor.html');
 assert.ok(mentor.includes('id="pspPortalInstallDrawerNav"'),'Mentor mobile More drawer exposes install item');
 assert.ok(mentor.includes('mDrawerClose();pspPortalInstall()'),'Mentor mobile installer closes More drawer before install');
 assert.ok(mentor.includes('window.pspPortalInstallSync?.()'),'Mentor mobile drawer refreshes install status');
});

test('Sidebar installer safely prompts or explains browser-specific installation',()=>{
 const js=read('portal-install-v1.js');
 assert.doesNotThrow(()=>new Function(js),'installer is valid JavaScript');
 assert.ok(js.includes("'beforeinstallprompt'"),'captures the Android native install prompt');
 assert.ok(js.includes('await prompt.prompt()'),'uses browser install prompt when available');
 assert.ok(js.includes('await prompt.userChoice'),'awaits actual browser choice');
 assert.ok(js.includes("'appinstalled'"),'updates installed status only after native event');
 assert.ok(js.includes("guide('browser')"),'provides Chrome manual instructions when prompt unavailable');
 assert.ok(js.includes("guide('ios')"),'provides Safari Add to Home Screen instructions');
 assert.ok(js.includes("guide('installed')"),'shows installed status when in standalone app');
 assert.ok(js.includes('window.pspPortalInstallSync=sync'),'supports late-rendered Mentor mobile More menu');
 assert.ok(!/localStorage\.clear\(|sessionStorage\.clear\(|auth\.signOut/.test(js),'installer must not touch existing logins');
});
