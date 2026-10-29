const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('Both admin routes ship interactive status/product filters and staff grant manager',()=>{
 for(const name of ['admin/index.html','admin-panel.html']){
  const html=read(name);
  for(const asset of ['admin-eai-review-v498.css?v=20261029-v498',
                      'admin-eai-staff-access-v498.js?v=20261029-v498',
                      'admin-ea-indicator-enterprise-v374.js?v=20261029-v498-filters']){
   assert.equal(html.split(asset).length-1,1,asset+' missing on '+name);
  }
  assert.ok(html.indexOf('admin-eai-review-v498.css')<html.indexOf('admin-eai-staff-access-v498.js'));
 }
});
test('Mentor navigation shows both tabs only after explicit server grant',()=>{
 const html=read('psp-mentor.html');
 assert.match(html,/mentor-staff-review-v498\.css/);
 assert.match(html,/mentor-staff-review-v498\.js/);
 assert.match(html,/\['indicator_review','🧩','EA & Indicator'\]/);
 assert.match(html,/\['ib_review','🛡️','IB Verification'\]/);
 assert.match(html,/await window\.PSPMentorStaffV498\?\.prepare\(sb\)/);
 assert.match(html,/MENTOR_ACCESS\.indicator_review=staffToggles\.indicator_review&&staffPermission\.indicator_review===true/);
 assert.match(html,/MENTOR_ACCESS\.ib_review=staffToggles\.ib_review&&staffPermission\.ib_review===true/);
 assert.match(html,/indicator_review:\(\)=>window\.PSPMentorStaffV498\?\.render\('indicator_review'\)/);
});
test('Application filter statuses preserve unchecked, approved, rejected and ready categories',()=>{
 const js=read('admin-ea-indicator-enterprise-v374.js');
 assert.doesNotThrow(()=>new Function(js));
 const from=js.indexOf('function statusMatch('),to=js.indexOf('function setOptions(',from);
 assert.ok(from>0&&to>from);
 const context={issuedStatuses:new Set(['ready','downloaded']),activeStatuses:new Set(['pending','under_review','approved','license_preparing'])};
 vm.createContext(context);vm.runInContext(js.slice(from,to),context);
 const status=(value,key)=>vm.runInContext('statusMatch({status:'+JSON.stringify(value)+'},'+JSON.stringify(key)+')',context);
 assert.equal(status('pending','new'),true);
 assert.equal(status('pending','rejected'),false);
 assert.equal(status('approved','approved'),true);
 assert.equal(status('license_preparing','approved'),true);
 assert.equal(status('rejected','rejected'),true);
 assert.equal(status('ready','ready'),true);
 assert.equal(status('downloaded','downloaded'),true);
 assert.equal(status('ready','approved'),false);
 for(const selector of ['eaiV498Product','eaiV498Broker','eaiV498Verification','eaiV498Date'])assert.ok(js.includes(selector));
 assert.match(js,/state\.filter=order\.find/);
});
test('Staff review modules parse and never expose private licensed file downloads',()=>{
 for(const name of ['mentor-staff-review-v498.js','admin-eai-staff-access-v498.js'])
  assert.doesNotThrow(()=>new Function(read(name)),name);
 const mentor=read('mentor-staff-review-v498.js');
 assert.match(mentor,/psp_staff_my_v498/);
 assert.match(mentor,/psp_staff_queue_v498/);
 assert.match(mentor,/psp_staff_ib_decide_v498/);
 assert.match(mentor,/psp_staff_note_v498/);
 assert.match(mentor,/permissions\.ib_decide/);
 assert.match(mentor,/const field=\(kind,id\)/);
 assert.doesNotMatch(mentor,/ea-indicator-licensed|storage\.from\('ea-indicator-licensed'\)/);
 const grants=read('admin-eai-staff-access-v498.js');
 assert.match(grants,/psp_staff_grant_v498/);
 assert.match(grants,/psp_staff_list_v498/);
 assert.match(grants,/eaiV375Insights/);
});
test('Database SQL enforces opt-in staff grants, audit trail and a trusted admin allowlist',()=>{
 const s=read('supabase/sql/498_staff_review_permissions_and_queues.sql');
 const harden=read('supabase/sql/499_staff_trusted_admin_and_profile_role_guard.sql');
 assert.match(s,/create table if not exists public\.psp_staff_access_v498/i);
 assert.match(s,/create table if not exists public\.psp_staff_reviews_v498/i);
 assert.match(s,/enable row level security/i);
 assert.match(s,/revoke all on function public\.psp_staff_queue_v498\(text\) from public,anon/i);
 assert.match(s,/not public\.psp_staff_can_v498\('ib_decide'\)/i);
 assert.match(s,/bucket_id='ea-indicator-proofs'/);
 assert.match(harden,/create table if not exists public\.psp_staff_admins_v499/i);
 assert.match(harden,/psp_staff_is_admin_v499/);
 assert.match(harden,/psp_guard_profile_role_v499 before update of role/i);
});
