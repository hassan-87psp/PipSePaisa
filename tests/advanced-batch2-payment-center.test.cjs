'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../admin-payments-ux-v222.js'),'utf8');
const getSection=(from,to)=>{
 const a=source.indexOf(from),b=source.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,'Expected existing payments section: '+from);
 return source.slice(a,b);
};
const segmentCode=getSection('function low(v){','function manualAdminV234(');
const scopeCode=getSection('function paymentScopeMatchV232(','function paymentFiltered()');
const revenueCode=getSection('function courseUserKeyV222(','function paidScopeItemsV232(');
const paidItemsCode=getSection('function paidScopeItemsV232(','function paidScopeLabelV233(');
const scopeLabelCode=getSection('function paidScopeLabelV233(','function paymentTabLabelV233(');
function harness(items=[]){
 const env={
  S:{profiles:{},registrationAt:{}},
  paymentItems:()=>items,
  paidCourse:()=>true,
  payRejected:()=>false,
  payApproved:i=>i.status==='approved',
  payProcessing:()=>false,
  payNeeds:()=>false,
  payRejectedOnly:()=>false,
  payExpired:()=>false,
  paymentTabItems:()=>items,
  isExpired:()=>false
 };
 const ctx=vm.createContext(env);
 vm.runInContext(segmentCode+scopeCode+revenueCode+paidItemsCode+scopeLabelCode,ctx);
 return name=>vm.runInContext(name,ctx);
}
function item(id,user,amount,batch,segment='advanced'){
 return {id,kind:'course',amount,currency:'USD',status:'approved',created_at:'2026-10-12T01:00:00Z',
  raw:{id,user_id:user,course_key:'advanced',course_name:'Advanced Forex Course',
    course_segment:segment,psp_batch_key:batch,price:amount,updated_at:'2026-10-12T01:00:00Z'}};
}
test('Paid Advanced Batch 2 is created only for explicit advanced_b2 tag',()=>{
 const run=harness();
 assert.equal(run("courseSegmentV205({course_key:'advanced',course_segment:'advanced',psp_batch_key:null})"),'advanced');
 assert.equal(run("courseSegmentV205({course_key:'advanced',course_segment:'advanced',psp_batch_key:'advanced_b1'})"),'advanced');
 assert.equal(run("courseSegmentV205({course_key:'advanced',course_segment:'advanced',psp_batch_key:'advanced_b2'})"),'advanced_b2');
 assert.equal(run("courseSegmentV205({course_key:'advance-fundamental',course_segment:'advance_fundamental'})"),'advance_fundamental');
 assert.equal(run("courseSegmentV205({course_key:'basic-b2',psp_batch_key:'basic_b2'})"),'batch2');
 assert.equal(run("paymentItemLabelV209({kind:'course',raw:{course_key:'advanced',psp_batch_key:'advanced_b2'}})"),'Advanced Forex Course — Batch 2');
});
test('Advanced Batch 2 card selects only tagged students, and old records remain in existing Advanced card',()=>{
 const old=item('e1','student-old',150,'advanced_b1'),b2=item('e2','student-new',175,'advanced_b2');
 const run=harness([old,b2]);
 assert.equal(run("paymentScopeMatchV232(paymentItems()[0],'advanced')"),true);
 assert.equal(run("paymentScopeMatchV232(paymentItems()[0],'advanced_b2')"),false);
 assert.equal(run("paymentScopeMatchV232(paymentItems()[1],'advanced')"),false);
 assert.equal(run("paymentScopeMatchV232(paymentItems()[1],'advanced_b2')"),true);
 assert.equal(run("paidScopeItemsV232('advanced').length"),1);
 assert.equal(run("paidScopeItemsV232('advanced_b2').length"),1);
 assert.equal(run("paidScopeItemsV232('paid').length"),2);
});
test('All Paid Courses retains BOTH Advanced batches in revenue and separate per-batch totals',()=>{
 const old=item('e1','student-old',150,'advanced_b1'),b2=item('e2','student-new',175,'advanced_b2');
 const run=harness([old,b2]);
 assert.equal(run('paymentCourseRevenueV222().advanced'),150);
 assert.equal(run('paymentCourseRevenueV222().advancedB2'),175);
 assert.equal(run('paymentCourseRevenueV222().total'),325);
 assert.equal(run("paidScopeMetricsV232('advanced').revenue"),150);
 assert.equal(run("paidScopeMetricsV232('advanced_b2').revenue"),175);
 assert.equal(run("paidScopeMetricsV232('paid').revenue"),325);
 assert.equal(run("paidScopeMetricsV232('advanced_b2').approved"),1);
});
test('No explicitly tagged Batch 2 payments results in a zero card, not fake reassignment',()=>{
 const run=harness([item('legacy','legacy-user',150,null)]);
 assert.equal(run("paidScopeMetricsV232('advanced_b2').users"),0);
 assert.equal(run("paidScopeMetricsV232('advanced_b2').approved"),0);
 assert.equal(run("paidScopeMetricsV232('advanced_b2').revenue"),0);
 assert.equal(run("paidScopeMetricsV232('advanced').users"),1);
});
test('Batch 1 is marked closed for new enrollments; Batch 2 remains selectable',()=>{
 assert.match(source,/card\('advanced','Advanced Forex — Batch 1','Sir Sajid Khan Ghori · Closed to new enrollments'/);
 assert.match(source,/card\('advanced_b2','Advanced Forex — Batch 2'/);
 const run=harness();
 assert.equal(run("paidScopeLabelV233('advanced')"),'Advanced Forex Course — Batch 1');
 assert.equal(run("paidScopeLabelV233('advanced_b2')"),'Advanced Forex Course — Batch 2');
 assert.equal(run("paymentItemLabelV209({kind:'course',raw:{course_key:'advanced',psp_batch_key:'advanced_b1'}})"),'Advanced Forex Course — Batch 1');
});
test('Database migration fixes cohort boundary without touching paid price or course access',()=>{
 const sql=fs.readFileSync(path.join(__dirname,'../supabase/sql/512_advanced_course_october_cohorts.sql'),'utf8');
 assert.match(sql,/2026-10-01 00:00:00\+05/g);
 assert.match(sql,/CREATE TRIGGER zzz_psp_assign_advanced_batch_v542/);
 assert.match(sql,/SET LOCAL session_replication_role = 'replica'/);
 assert.doesNotMatch(sql,/SET\s+payment_status\s*=|SET\s+price\s*=|SET\s+enrollment_status\s*=/i);
 const manual=fs.readFileSync(path.join(__dirname,'../admin-manual-paid-course-v221.js'),'utf8');
 assert.match(manual,/Advanced Forex Course — Batch 2 \(New Enrollments\)/);
});
test('Payment Review Center exposes clickable Batch 2 card, status filters and scope label',()=>{
 assert.match(source,/card\('advanced_b2','Advanced Forex — Batch 2'/);
 assert.match(source,/if\(scope==='advanced_b2'\)return 'Advanced Forex Course — Batch 2'/);
 assert.match(source,/\['paid','advanced','advanced_b2','advance_fundamental','vsa'\]/);
 const run=harness();
 assert.equal(run("paidScopeLabelV233('advanced_b2')"),'Advanced Forex Course — Batch 2');
 for(const path of ['admin/index.html','admin-panel.html']){
  const html=fs.readFileSync(require('node:path').join(__dirname,'..',path),'utf8');
  assert.match(html,/admin-payments-ux-v222\.js\?v=20261102-v542-batch-cutoff/);
 }
});
