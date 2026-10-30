'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'admin-account-verification-v49.js'),'utf8');
const css=fs.readFileSync(path.join(root,'admin-account-verification-v49.css'),'utf8');

function harness({errorBatch=-1}={}){
  const requests=Array.from({length:56},(_,i)=>({
    user_id:'test-user-'+(i+1),submission_status:'pending',
    submitted_at:'2026-10-30T01:00:00Z',
    broker:'dprime',trading_account_id:'900'+i,available_deposit:500
  }));
  const people=new Map(requests.map((r,i)=>[r.user_id,{
    id:r.user_id,full_name:'Trader '+(i+1),
    email:'trader'+(i+1)+'@example.test',
    whatsapp:'+92300000'+String(i).padStart(4,'0'),
    phone:null
  }]));
  let batch=0;
  const chunks=[];
  const sb={from(table){
    if(table==='account_verifications')return{
      select(columns){assert.equal(columns,'*');return{
        order(){return Promise.resolve({data:requests,error:null})}
      }}
    };
    if(table==='profiles')return{
      select(columns){
        assert.equal(columns,'id,full_name,email,phone,whatsapp');
        return {in(field,ids){
          assert.equal(field,'id');
          chunks.push([...ids]);
          const n=batch++;
          if(n===errorBatch)return Promise.resolve({data:null,error:{message:'Too long to fetch'}});
          if(ids.length>10)return Promise.resolve({data:null,error:{message:'URL too long'}});
          return Promise.resolve({data:ids.map(id=>people.get(id)),error:null});
        }}
      }
    };
    throw Error('Unknown table '+table);
  }};
  const body={innerHTML:''};
  const notice={style:{display:'none'}};
  const document={
    readyState:'loading',addEventListener(){},
    querySelector(selector){if(selector==='#av49Body')return body;if(selector==='#av49ContactWarning')return notice;return null},
    querySelectorAll(){return[]}
  };
  const sandbox={document,window:{sb},sb,
    console:{warn(){}},setInterval(){return 1},clearInterval(){},setTimeout(){},clearTimeout(){},
    CSS:{escape(x){return x}}
  };
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'admin-account-verification-v49.js'});
  return {api:sandbox.window.PSPAdminVerification,body,notice,chunks};
}

test('56 pending requests resolve applicant name, email and WhatsApp through short API batches',async()=>{
  const h=harness();
  await h.api.loadRows();
  assert.equal(h.chunks.length,6,'56 profiles must use six batches rather than one oversized .in() URL');
  assert.ok(h.chunks.every(ids=>ids.length<=10),'batch must remain within safe URL limits');
  for(const n of [1,10,11,36,56]){
    assert.ok(h.body.innerHTML.includes('Trader '+n+'</strong>'), 'visible name '+n);
    assert.ok(h.body.innerHTML.includes('trader'+n+'@example.test'), 'visible email '+n);
    assert.ok(h.body.innerHTML.includes('+92300000'+String(n-1).padStart(4,'0')), 'visible WhatsApp '+n);
  }
  assert.equal(h.notice.style.display,'none','healthy lookup must not show warning');
  assert.ok(!h.body.innerHTML.includes('test-user-1</strong>'),'do not display UUID as the primary name');
});

test('Partial contact failure is visible to admin without losing verified rows or approval actions',async()=>{
  const h=harness({errorBatch:1});
  await h.api.loadRows();
  assert.equal(h.notice.style.display,'block');
  assert.ok(h.body.innerHTML.includes('Trader 1</strong>'));
  assert.ok(h.body.innerHTML.includes('Name unavailable</strong>'));
  assert.ok(h.body.innerHTML.includes('PSPAdminVerification.review('),'approval actions still available');
});

test('Admin links refresh both assets and contact text remains legible',()=>{
  for(const file of ['admin/index.html','admin-panel.html']){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.ok(html.includes('admin-account-verification-v49.js?v=20261030-v187-contacts'),file+' script version');
    assert.ok(html.includes('admin-account-verification-v49.css?v=20261030-v187-contacts'),file+' style version');
  }
  assert.ok(css.includes('.av49-contact-line'));
  assert.ok(css.includes('.av49-contact-name'));
  assert.ok(source.includes('phoneLabel'));
  assert.ok(source.includes('contactsLoadError'));
  assert.ok(!source.includes("select('id,full_name,email,phone,whatsapp').in('id',ids)"),'old too-long query gone');
});
