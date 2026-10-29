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
