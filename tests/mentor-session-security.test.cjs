'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../psp-mentor.html'),'utf8');
function extract(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Mentor code section exists: '+start);
 return html.slice(a,b);
}
const boot=extract('async function bootMentorAuth(){',"\nif(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootMentorAuth);");
const after=extract('async function afterLogin(){','\nasync function logout(){');
function bootHarness({session=null,sessionError=false,remoteUser=null}={}){
 const calls={session:0,user:0,opened:0};
 const sb={auth:{
  getSession:async()=>{calls.session++;if(sessionError)throw Error('local session unavailable');return{data:{session}}},
  getUser:async()=>{calls.user++;return{data:{user:remoteUser}}}
 }};
 const c={sb,console:{warn(){}},ensureSupabaseClient:async()=>true,
  afterLogin:async()=>{calls.opened++}};
 vm.createContext(c);vm.runInContext(boot,c);return {calls,run:()=>vm.runInContext('bootMentorAuth()',c)};
}
test('Mentor guest startup uses one local session check, not a redundant remote user request',async()=>{
 const h=bootHarness();
 await h.run();assert.deepEqual(h.calls,{session:1,user:0,opened:0});
});
test('Mentor with a stored session validates identity once in afterLogin',async()=>{
 const h=bootHarness({session:{user:{id:'mentor1'}}});
 await h.run();assert.deepEqual(h.calls,{session:1,user:0,opened:1});
});
test('Mentor remote user fallback happens only after local session check fails',async()=>{
 const h=bootHarness({sessionError:true,remoteUser:{id:'mentor1'}});
 await h.run();assert.deepEqual(h.calls,{session:1,user:1,opened:1});
});
function roleHarness(profile,userRole='mentor'){
 const calls={errors:[],dbWrites:0,opened:false,navs:0,loaded:0};
 const user={id:'mentor1',email:'test@example.com',user_metadata:{role:userRole}};
 const nodes={};
 const node=id=>(nodes[id]??={classList:{add(value){if(id==='app'&&value==='show')calls.opened=true}},textContent:''});
 const sb={auth:{getUser:async()=>({data:{user}})},
  from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:profile}),
   update(){calls.dbWrites++;return this},upsert(){calls.dbWrites++;return this}})};
 const c={sb,ME:null,MENTOR_ACCESS:{indicator_review:false,ib_review:false},
  window:{PSPMentorStaffV498:{prepare:async()=>({indicator_review:false,ib_review:false})}},
  document:{getElementById:node},showErr:t=>calls.errors.push(t),resetBtn(){},
  loadMentorAccessSettings:async()=>{calls.loaded++},buildNav(){calls.navs++},
  showPage(){},firstMentorPage:()=> 'performance',startClock(){},initBell(){}};
 vm.createContext(c);vm.runInContext(after,c);
 return {calls,ctx:c,run:()=>vm.runInContext('afterLogin()',c)};
}
test('Editable auth user metadata cannot grant Mentor access without an approved server profile',async()=>{
 const h=roleHarness(null,'mentor');
 await h.run();
 assert.equal(h.calls.opened,false);
 assert.equal(h.calls.dbWrites,0,'missing profile must not be upserted with metadata role');
 assert.equal(h.calls.loaded,0);
 assert.match(h.calls.errors.join(' '),/profile could not be verified/);
});
test('Server profile user role takes precedence over self-declared Mentor metadata',async()=>{
 const h=roleHarness({id:'mentor1',email:'test@example.com',role:'user'},'mentor');
 await h.run();
 assert.equal(h.calls.opened,false);
 assert.equal(h.calls.dbWrites,0);
 assert.match(h.calls.errors.join(' '),/pending administrator approval/);
});
test('Previously approved server-side Mentor role still opens unchanged workspace',async()=>{
 const h=roleHarness({id:'mentor1',role:'mentor',full_name:'Verified Mentor',email:'test@example.com',mentor_code:'TEST123'},'user');
 await h.run();
 assert.equal(h.calls.opened,true);
 assert.equal(h.calls.loaded,1);
 assert.equal(h.calls.navs,1);
 assert.deepEqual(h.calls.errors,[]);
});
