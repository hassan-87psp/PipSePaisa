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

test('All private signed download actions use custom Content-Disposition filename',()=>{
 const signed=source.match(/createSignedUrl\(r\.licensed_file_path,120,\{download:window\.PSPEAILicensedDownloadName\(r\)\}\)/g)||[];
 assert.equal(signed.length,2,'Both legacy and premium downloads should use the friendly name');
 const loader=read('user-app-core-v29.js');
 assert.match(loader,/ea-indicator-user-v215\.js\?v=20261031-v520-friendly-file-name/);
 for(const page of ['dashboard/index.html','eaindicator/index.html','profile/index.html']){
  assert.match(read(page),/user-app-core-v29\.js\?v=20261031-v520-friendly-license/);
 }
});
