'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

const source=read('ea-indicator-user-v215.js');
const start=source.indexOf('function licensedDownloadName(r){');
const end=source.indexOf('window.PSPEAILicensedDownloadName=licensedDownloadName;',start);
assert.ok(start>=0&&end>start,'Friendly filename helper must be registered');
const nameFor=new Function(source.slice(start,end)+';return licensedDownloadName;')();

test('EX5 downloads use indicator name and licensed trading account instead of storage UUID',()=>{
 const request={
  ea_indicator_products:{title:'PipSePaisa P+ MATRIX PRO — MT5 Indicator',platform:'MT5'},
  trading_account_id:'31231835',
  licensed_file_name:'FINAL 2.ex5',
  licensed_file_path:'user/request/c8068644-262c-447d-a13b-ac461944b640-FINAL_2.ex5'
 };
 assert.equal(nameFor(request),'PipSePaisa_P+_MATRIX_PRO_31231835.ex5');
 request.licensed_account_id='458090014';
 assert.equal(nameFor(request),'PipSePaisa_P+_MATRIX_PRO_458090014.ex5');
});

test('File extension and indicator label remain correct across products',()=>{
 assert.equal(nameFor({
  ea_indicator_products:{title:'PipSePaisa Pivot Indicator — MT5',platform:'MT5'},
  trading_account_id:'9979381',licensed_file_name:'private-build.ex5'
 }),'PipSePaisa_Pivot_Indicator_9979381.ex5');
 assert.equal(nameFor({
  ea_indicator_products:{title:'Trading Sessions MT4 Indicator',platform:'MT4'},
  trading_account_id:'112233',licensed_file_name:'locked-file.ex4'
 }),'Trading_Sessions_112233.ex4');
 assert.equal(nameFor({
  ea_indicator_products:{title:'Sessions Bundle',platform:'MT5'},
  trading_account_id:'778899',licensed_file_name:'archive.zip'
 }),'Sessions_Bundle_778899.zip');
});


test('Direct Blob downloads use friendly filename without creating a blank tab',async()=>{
 assert.doesNotMatch(source,/window\.open\('about:blank'/);
 assert.equal((source.match(/await saveLicensedFile\(c,r\)/g)||[]).length,2);
 assert.doesNotMatch(source,/if\(tab\)tab\.location\.href/);
 const a=source.indexOf('async function saveLicensedFile(c,r){');
 const b=source.indexOf('function licenseRemaining(',a);
 assert.ok(a>=0&&b>a);
 const downloads=[];
 const url={createObjectURL:()=> 'blob:licensed',revokeObjectURL:()=>{}};
 const doc={
  body:{appendChild(node){downloads.push(node)}},
  createElement:()=>({style:{},click(){this.clicked=true},remove(){this.removed=true}})
 };
 const save=new Function('licensedDownloadName','URL','document','setTimeout',
  source.slice(a,b)+';return saveLicensedFile;')(nameFor,url,doc,()=>{});
 const req={
  ea_indicator_products:{title:'PipSePaisa P+ MATRIX PRO — MT5 Indicator',platform:'MT5'},
  trading_account_id:'31231835',licensed_file_path:'private/request/file.ex5',licensed_file_name:'FINAL 2.ex5'
 };
 let fetchCount=0;
 const client={storage:{from(bucket){
  assert.equal(bucket,'ea-indicator-licensed');
  return {download:async path=>{fetchCount++;assert.equal(path,req.licensed_file_path);return {data:{size:6310000},error:null}}}
 }}};
 assert.equal(await save(client,req),true);
 assert.equal(fetchCount,1);
 assert.equal(downloads.length,1);
 assert.equal(downloads[0].download,'PipSePaisa_P+_MATRIX_PRO_31231835.ex5');
 assert.equal(downloads[0].clicked,true);
 assert.equal(downloads[0].removed,true);
});

test('License time remaining uses actual issued expiry and updates every second',()=>{
 const start=source.indexOf('function licenseRemaining(');
 const end=source.indexOf('function refreshLicenseClocks(',start);
 assert.ok(start>=0&&end>start);
 const remaining=new Function(source.slice(start,end)+';return licenseRemaining;')();
 const startTime=Date.parse('2026-10-31T07:15:06Z');
 const expiry='2026-11-30T07:15:06Z';
 assert.equal(remaining(expiry,startTime),'30d 00h 00m 00s');
 assert.equal(remaining(expiry,startTime+1000),'29d 23h 59m 59s');
 assert.equal(remaining(expiry,startTime+30*86400000),'Expired');
 assert.equal(remaining(null,startTime),'Expiry date unavailable');
 assert.match(source,/LICENSE TIME REMAINING/);
 assert.match(source,/data-eai-license-expiry/);
 assert.match(source,/setInterval\(refreshLicenseClocks,1000\)/);
});

test('All user panel entries load the updated direct-download handler',()=>{
 const loader=read('user-app-core-v29.js');
 assert.match(loader,/ea-indicator-user-v215\.js\?v=20261031-v521-blob-countdown/);
 for(const page of ['dashboard/index.html','eaindicator/index.html','profile/index.html']){
  assert.match(read(page),/user-app-core-v29\.js\?v=20261031-v521-direct-download/);
 }
});
