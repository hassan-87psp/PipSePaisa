'use strict';
const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('content-studio/index.html');
const studio=read('content-studio/studio.js');
const nav=read('content-studio/private-user-nav-v1.js');
const admin=read('admin-panel.html');
const mentor=read('psp-mentor.html');
const dashboard=read('dashboard/index.html');
const edge=read('supabase/functions/content-studio-ai/index.ts');
test('private page and workflow controls exist',()=>{
  assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);
  for(const id of ['authGate','studioApp','newsList','generate','hook','explanation','market_impact','closing','cta','seo_title','caption','hashtags','saveScript','sendReview','approveScript','markPublished','savedList','plannerList','manageNav','memberList','teleprompter']){
    assert.ok(html.includes('id="'+id+'"'),id);
  }
  assert.match(html,/id="studioApp"[^>]*hidden/);
  assert.match(html,/id="manageNav"[^>]*hidden/);
  assert.match(html,/content-studio\/studio.js/);
});
test('JS referenced DOM elements exist (except dynamic deny message)',()=>{
  const references=[...new Set([...studio.matchAll(/\$\(['"]([\w-]+)['"]\)/g)].map(m=>m[1]))].filter(id=>id!=='denyNote');
  for(const id of references) assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
});
test('news sources retain URL and never shadow native URL constructor',()=>{
  assert.match(studio,/const SUPABASE_URL=/);
  assert.doesNotMatch(studio,/\bconst URL=/);
  assert.match(studio,/new URL\(String\(u\)\)/);
  assert.match(studio,/https:\/\/pipsepaisa-api\.vercel\.app\/api\/news/);
  assert.match(studio,/story\.link\|\|story\.url/);
});
test('authenticated per-user permission check precedes private interface',()=>{
  assert.match(studio,/client\.auth\.getUser\(\)/);
  assert.match(studio,/client\.rpc\('psp_content_permission_v1'\)/);
  assert.match(studio,/if\(!permission&&!manager\)/);
  assert.match(studio,/\$\('studioApp'\)\.hidden=false/);
  assert.match(nav,/psp_content_permission_v1/);
  assert.match(nav,/!\['viewer','creator','editor','approver'\]\.includes\(permission\.data\)/);
  assert.match(nav,/reference\.insertAdjacentElement\('afterend',link\)/);
});
test('admin and mentor portal provide access-management entry',()=>{
  assert.match(admin,/content-studio\/\?portal=admin&amp;manage=1/);
  assert.match(mentor,/content-studio\/\?portal=mentor&manage=1/);
  assert.match(dashboard,/content-studio\/private-user-nav-v1\.js/);
  assert.match(studio,/psp_content_search_users_v1/);
  assert.match(studio,/psp_content_set_access_v1/);
});
test('AI endpoint checks user JWT and individual creator permission',()=>{
  assert.match(edge,/getUser\(jwt\)/);
  assert.match(edge,/psp_content_permission_v1/);
  assert.match(edge,/\['creator','editor','approver'\]/);
  assert.match(edge,/requires_review:true/);
  assert.match(edge,/https:\/\/pipsepaisa-api\.vercel\.app\/api\/ai-report/);
  assert.doesNotMatch(edge,/SUPABASE_SERVICE_ROLE_KEY/);
});
test('editor can save, review, approve, publish, copy and teleprompt',()=>{
  for(const op of ['generateScript','saveScript','changeStatus','copyScript','openPrompter','renderPlanner','loadMembers']){
    assert.ok(studio.includes('function '+op+'('),'Missing '+op);
  }
  assert.match(studio,/scheduled_for/);
  assert.match(studio,/published_url/);
  assert.match(studio,/isApprover\(\)/);
});
