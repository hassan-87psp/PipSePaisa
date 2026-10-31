const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Both Admin routes preload critical first paint CSS and V503 modules',()=>{
 for(const p of ['admin/index.html','admin-panel.html']){
  const h=read(p);
  for(const name of [
   'pspAdminNoLegacyPaintV503',
   'admin-eai-review-v498.css?v=20261031-v515-queue',
   'admin-eai-staff-access-v498.js?v=20261029-v503-grant-issue',
   'admin-ea-indicator-enterprise-v374.js?v=20261031-v515-queue',
   'admin-dashboard-v181.js?v=20261029-v503-first-paint'
  ])assert.equal(h.split(name).length-1,1,name+' in '+p);
  assert.ok(h.indexOf('pspAdminNoLegacyPaintV503')<h.indexOf('admin-dashboard-v181.css'));
  assert.match(h,/#page-dashboard:not\(\.ad181-mounted\)>\*\{display:none!important\}/);
 }
 const dash=read('admin-dashboard-v181.js');
 assert.match(dash,/p\.classList\.add\('ad181-mounted'\)/);
 assert.match(dash,/if\(!p\.querySelector\('\.ad181-shell'\)\)p\.innerHTML=markup\(\)/);
});

test('Admin queue filters include unchecked, approved, rejected, all three indicators',()=>{
 const js=read('admin-ea-indicator-enterprise-v374.js');
 assert.doesNotThrow(()=>new Function(js));
 const from=js.indexOf('function statusMatch('),to=js.indexOf('function setOptions(',from);
 assert.ok(from>0&&to>from);
 const c={issuedStatuses:new Set(['ready','downloaded']),isExpired:r=>r._expiry===0};
 vm.createContext(c);vm.runInContext(js.slice(from,to),c);
 const match=(s,key)=>vm.runInContext('statusMatch({status:'+JSON.stringify(s)+'},'+JSON.stringify(key)+')',c);
 assert.equal(match('pending','new'),true);
 assert.equal(match('approved','approved'),false);
 assert.equal(match('rejected','rejected'),true);
 assert.equal(match('ready','approved'),true);
 assert.equal(match('downloaded','approved'),true);
 assert.equal(match('ready','expired'),false);
 assert.match(js,/Reapprove \/ Issue/);
 assert.match(js,/Reapprove Request/);
 assert.match(js,/verification\(r\)\.state!=='ok'/);
 for(const selector of ['eaiV498Product','eaiV374Search'])
  assert.ok(js.includes(selector));
 const admin=read('admin-ea-indicator-v238.js');
 assert.match(admin,/status==='ready'&&!file&&!r\.licensed_file_path/);
 assert.match(admin,/Cannot approve: the exact broker\/account/);
});

test('Mentor new navigation, permissions and active UI use Website Access Approvals',()=>{
 const html=read('psp-mentor.html');
 assert.match(html,/mentor-staff-review-v503\.css/);
 assert.match(html,/mentor-staff-review-v503\.js/);
 assert.match(html,/\['indicator_review','🧩','EA & Indicator'\]/);
 assert.match(html,/\['ib_review','🛡️','Website Access Approvals'\]/);
 assert.match(html,/await window\.PSPMentorStaffV498\?\.prepare\(sb\)/);
 assert.match(html,/MENTOR_ACCESS\.indicator_review=staffToggles\.indicator_review&&staffPermission\.indicator_review===true/);
 assert.match(html,/MENTOR_ACCESS\.ib_review=staffToggles\.ib_review&&staffPermission\.ib_review===true/);
 const mentor=read('mentor-staff-review-v503.js');
 assert.doesNotThrow(()=>new Function(mentor));
 assert.match(mentor,/s503Product/);
 assert.match(mentor,/s503Broker/);
 assert.match(mentor,/s503Verification/);
 assert.match(mentor,/s503Date/);
 assert.match(mentor,/manualFilter=true/);
 // Guard Mentor refresh against changing the default Pending status when unrelated filters hide its rows.
 assert.match(mentor,/!st\.rows\.some\(r=>\['pending','submitted'\]\.includes\(status\(kind,r\)\)\)/);
 assert.doesNotMatch(mentor,/st\.filter==='pending'&&!visible\(kind\)\.length/);
  assert.match(mentor,/psp_staff_queue_v498/);
 assert.match(mentor,/psp_staff_my_v498/);
 assert.match(mentor,/indicator_issue/);
 assert.match(mentor,/Reapprove & Issue File/);
 assert.match(mentor,/Approve & Deliver File/);
 assert.match(mentor,/psp_staff_indicator_decide_v501/);
 assert.match(mentor,/psp_staff_access_decide_v501/);
 assert.match(mentor,/createSignedUrl\(file,90\)/);
 assert.match(mentor,/kind==='indicator'\?'ea-indicator-proofs'/);
 assert.match(mentor,/if\(result\.error\)throw result\.error/);
 assert.match(mentor,/await conn\(\)\.storage\.from\('ea-indicator-licensed'\)\.remove\(\[uploaded\]\)/);
});

test('Mentor review permissions default to none, remain grant-only',async()=>{
 const module=read('mentor-staff-review-v503.js');
 const el={getElementById:()=>null};
 const c={document:el,window:null,console};
 c.window=c;vm.createContext(c);
 vm.runInContext(module,c);
 let result=await c.PSPMentorStaffV498.prepare({rpc:async()=>({data:{indicator_review:true,indicator_issue:false,ib_review:true,ib_decide:false}})});
 assert.equal(result.indicator_review,true);
 assert.equal(result.indicator_issue,false);
 assert.equal(result.ib_review,true);
 assert.equal(result.ib_decide,false);
 result=await c.PSPMentorStaffV498.prepare({rpc:async()=>({data:{indicator_review:false,indicator_issue:true,ib_review:false,ib_decide:true}})});
 assert.equal(result.indicator_review,false);
 assert.equal(result.indicator_issue,false);
 assert.equal(result.ib_review,false);
 assert.equal(result.ib_decide,false);
});

test('Admin grants independently control private issuing and 30-day website access',()=>{
 const grants=read('admin-eai-staff-access-v498.js');
 assert.doesNotThrow(()=>new Function(grants));
 assert.match(grants,/psp_staff_grant_v501/);
 assert.match(grants,/psp_staff_list_v498/);
 assert.match(grants,/p_indicator_issue:!!record\.issue/);
 assert.match(grants,/p_ib_decide:!!record\.decide/);
 assert.match(grants,/eai498Issue/);
 assert.match(grants,/Website Access/);
});

test('Server permissions enforce account lock, private upload and actual website access semantics',()=>{
 const db=read('supabase/sql/501_mentor_full_indicator_and_website_access.sql');
 const queue=read('supabase/sql/502_staff_queue_product_and_expiry_fields.sql');
 assert.match(db,/indicator_issue boolean NOT NULL DEFAULT false/i);
 assert.match(db,/psp_staff_is_admin_v499/);
 assert.match(db,/p_scope WHEN 'indicator_issue'|WHEN 'indicator_issue' THEN s\.indicator_review AND s\.indicator_issue/);
 assert.match(db,/bucket_id='ea-indicator-licensed'/);
 assert.match(db,/owner_id=auth\.uid\(\)::text/);
 assert.match(db,/p_request_id uuid,p_action text/);
 assert.match(db,/v_req\.user_id::text\|\|'\|'|v_req\.user_id::text\|\|'\/'/);
 assert.match(db,/p_action text,p_reason text DEFAULT ''/);
 assert.match(db,/approved_expires_at=v_until,admin_trial_expires_at=NULL/);
 assert.match(db,/v_until:=CASE WHEN v_action='approve' THEN now\(\)\+interval '30 days'/);
 assert.match(db,/REVOKE ALL ON FUNCTION public\.psp_staff_indicator_decide_v501/);
 assert.match(queue,/a\.approved_expires_at/);
 assert.match(queue,/r\.payment_proof_path/);
 assert.match(queue,/pr\.access_type/);
});

test('Stored private files stay scoped to individual student/request paths, not broad mentor access',()=>{
 const sql=read('supabase/sql/504_staff_storage_path_checks.sql');
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.psp_staff_storage_allowed_v504/);
 assert.match(sql,/IF NOT public\.psp_staff_can_v498\('indicator_issue'\)/);
 assert.match(sql,/IF NOT public\.psp_staff_can_v498\('indicator'\)/);
 assert.match(sql,/IF NOT public\.psp_staff_can_v498\('ib'\)/);
 assert.match(sql,/r\.user_id::text=user_folder AND r\.id::text=request_folder/);
 assert.match(sql,/owner_id=auth\.uid\(\)::text/);
 assert.match(sql,/FOR INSERT TO authenticated/);
 assert.match(sql,/FOR SELECT TO authenticated/);
 assert.match(sql,/FOR DELETE TO authenticated/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.psp_staff_storage_allowed_v504/);
});
