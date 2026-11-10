const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
test('Ad Link SQL maps to Basic B4 and Fundamental B3',()=>{
 const sql=read('supabase/sql/513_current_ad_link_batches.sql');
 for(const s of ['basic_b4','fundamental_b3','Basic Forex Course — Batch 4','Fundamental Forex Course — Batch 3']) assert.ok(sql.includes(s),s);
});
test('Edge Function confirmation and submission use current cohorts',()=>{
 const s=read('supabase/functions/ad-enroll/index.ts');
 for(const x of ['course_batch_key: course === "technical" ? "basic_b4" : "fundamental_b3"','Sir Sajid’s Batch 4','Sir Malik Ghulam Abbas’s Batch 3']) assert.ok(s.includes(x),x);
 assert.ok(!s.includes('Sir Sajid’s Batch 3'));
 assert.ok(!s.includes('Sir Malik Ghulam Abbas’s Batch 2'));
});
test('Current Ad Link landing pages and compatibility widgets use B4/B3',()=>{
 assert.match(read('sajid-khan-ghori/index.html'),/5 Live Sessions · Batch 4/);
 assert.match(read('ghulam-abbas/index.html'),/Free Course Enrollment · Batch 3/);
 for(const file of ['ad-enroll-v259.js','ad-enroll-v260.js','ad-enroll-v261.js']){
  const src=read(file);assert.match(src,/Batch 4/);assert.match(src,/Batch 3/);
 }
});
