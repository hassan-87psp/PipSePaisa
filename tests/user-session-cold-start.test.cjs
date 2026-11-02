'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../user-app-core-v29.js'),'utf8');
const from=source.indexOf('    let user = explicitUser || null;',source.indexOf('async function loadUserProfile('));
const to=source.indexOf('    if (!user) {\n      currentUser = null;',from);
assert.ok(from>0&&to>from,'User Panel session-restore code exists');
const section=source.slice(from,to);
function scenario({session=null,saved=false,explicit=null,throws=false,remote={id:'remote'}}={}){
 const calls={getSession:0,getUser:0};
 const sb={auth:{
  getSession:async()=>{calls.getSession++;if(throws)throw Error('temporary storage unavailable');return {data:{session}}},
  getUser:async()=>{calls.getUser++;return {data:{user:remote}}}
 }};
 const run=new Function('sb','explicitUser','pspHasSavedSessionV513','console',
  'return (async()=>{'+section+'return user;})()');
 return {calls,run:()=>run(sb,explicit,()=>saved,{warn(){}})};
}
test('Signed-out User Panel visits do not send unnecessary remote getUser request',async()=>{
 const h=scenario(),user=await h.run();
 assert.equal(user,null);assert.deepEqual(h.calls,{getSession:1,getUser:0});
});
test('Saved PWA session still checks remote user if first local session read is empty',async()=>{
 const h=scenario({saved:true,remote:{id:'restored'}}),user=await h.run();
 assert.equal(user.id,'restored');assert.deepEqual(h.calls,{getSession:1,getUser:1});
});
test('A local session does not trigger a redundant remote getUser call',async()=>{
 const h=scenario({session:{user:{id:'local'}}}),user=await h.run();
 assert.equal(user.id,'local');assert.deepEqual(h.calls,{getSession:1,getUser:0});
});
test('Directly provided authenticated user does not restart session restoration',async()=>{
 const h=scenario({explicit:{id:'signed-in'}}),user=await h.run();
 assert.equal(user.id,'signed-in');assert.deepEqual(h.calls,{getSession:0,getUser:0});
});
test('Local session check errors still allow remote auth recovery',async()=>{
 const h=scenario({throws:true,remote:{id:'fallback'}}),user=await h.run();
 assert.equal(user.id,'fallback');assert.deepEqual(h.calls,{getSession:1,getUser:1});
});
