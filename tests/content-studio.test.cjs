'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('content-studio/index.html');
const studio=read('content-studio/studio.js');
const nav=read('content-studio/private-user-nav-v1.js');
const toolsHtml=read('content-studio/pro-tools-ui-v1.html');
const toolsJS=read('content-studio/pro-tools-v1.js');
const toolsCSS=read('content-studio/pro-tools-v1.css');
const admin=read('admin-panel.html');
const accessHtml=read('content-studio-access/index.html');
const accessJS=read('content-studio-access/access.js');
const accessEdge=read('supabase/functions/content-studio-access/index.ts');
const luxeCSS=read('content-studio/mobile-luxe-v8.css');
const mentor=read('psp-mentor.html');
const dashboard=read('dashboard/index.html');
const edge=read('supabase/functions/content-studio-ai/index.ts');

test('private premium Studio with normal creator workflow',()=>{
 assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);
 for(const id of ['authGate','studioApp','newsList','generate','hook','explanation','market_impact','closing','cta','seo_title','caption','hashtags','saveScript','sendReview','approveScript','markPublished','savedList','plannerList','teleprompter','proToolsRoot','scriptInsights','bottomNav']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/id="studioApp"[^>]*hidden/);
 for(const page of ['home','news','editor','saved','calendar','tools','profile']) assert.ok(html.includes('data-panel="'+page+'"'),page);
 assert.match(html,/pro-tools-v1\.css/);
 assert.match(html,/pro-tools-v1\.js/);
 assert.doesNotMatch(html,/data-panel="manage"/);
 assert.doesNotMatch(html,/id="manageNav"|id="memberList"|id="openManageBtn"/);
});

test('Studio and Creator Toolkit DOM references resolve, no duplicate IDs',()=>{
 const all=html+toolsHtml;
 const ids=[...all.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
 const duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
 assert.deepEqual(duplicates,[]);
 const references=[...new Set([...studio.matchAll(/\$\(['"]([\w-]+)['"]\)/g),...toolsJS.matchAll(/\$\(['"]([\w-]+)['"]\)/g)].map(m=>m[1]))];
 for(const id of references.filter(id=>!['denyNote','telepro-controls'].includes(id))){
  assert.ok(ids.includes(id),'Missing '+id);
 }
 const panelNames=[...html.matchAll(/data-panel="([^"]+)"/g)].map(m=>m[1]);
 const navTargets=[...html.matchAll(/data-(?:view|bottom|go)="([^"]+)"/g)].map(m=>m[1]);
 for(const key of navTargets)assert.ok(panelNames.includes(key),'Broken nav: '+key);
});

test('script assets parse as valid JavaScript',()=>{
 for(const [name,text] of [['Studio',studio],['Pro Creator Tools',toolsJS],['Admin Access',accessJS]]){
  assert.doesNotThrow(()=>new vm.Script(text),name);
 }
});

test('news source links and authorization are safe',()=>{
 assert.match(studio,/const SUPABASE_URL=/);
 assert.doesNotMatch(studio,/\bconst URL=/);
 assert.match(studio,/new URL\(String\(u\)\)/);
 assert.match(studio,/https:\/\/pipsepaisa-api\.vercel\.app\/api\/news/);
 assert.match(studio,/story\.link\|\|story\.url/);
 assert.match(studio,/client\.auth\.getUser\(\)/);
 assert.match(studio,/client\.rpc\('psp_content_permission_v1'\)/);
 assert.match(studio,/if\(!permission\)/);
 assert.match(studio,/\$\('studioApp'\)\.hidden=false/);
 assert.match(nav,/psp_content_permission_v1/);
 assert.match(nav,/!\['viewer','creator','editor','approver'\]\.includes\(permission\.data\)/);
});

test('permissions are managed from Admin only, not Studio or Mentor',()=>{
 assert.match(admin,/content-studio-access\//);
 assert.match(accessHtml,/Content Studio Access/);
 assert.match(accessJS,/client\.auth\.getUser\(\)/);
 assert.match(accessJS,/p\.data\?\.role!=='admin'/);
 assert.match(accessJS,/client\.functions\.invoke\('content-studio-access'/);
 assert.match(accessEdge,/psp_content_set_access_v1/);
 assert.match(accessEdge,/admin\.data\?\.role!=="admin"/);
 assert.match(accessEdge,/email_sent:true/);
 assert.match(accessJS,/Resend Email/);
 assert.match(accessJS,/psp_content_search_users_v1/);
 assert.doesNotMatch(studio,/psp_content_set_access_v1|psp_content_search_users_v1|loadMembers/);
 assert.doesNotMatch(mentor,/content-studio\/\?portal=mentor&manage=1/);
 assert.doesNotMatch(mentor,/\['contentstudio','🎬','Content Studio Access'\]/);
 assert.match(dashboard,/content-studio\/private-user-nav-v1\.js/);
});

test('AI endpoint validates JWT and enables private multi-mode creation',()=>{
 assert.match(edge,/getUser\(jwt\)/);
 assert.match(edge,/psp_content_permission_v1/);
 assert.match(edge,/\['creator','editor','approver'\]/);
 for(const mode of ["'generate'","'rewrite'","'pack'","'quality'","'thumbnail'","'translate'"])assert.ok(edge.includes(mode),mode);
 assert.match(edge,/brand_voice/);
 assert.match(edge,/requires_review:true/);
 assert.match(edge,/https:\/\/pipsepaisa-api\.vercel\.app\/api\/ai-report/);
 assert.doesNotMatch(edge,/SUPABASE_SERVICE_ROLE_KEY/);
});

test('core workflow retains drafts, reviews, approval, SEO and teleprompter',()=>{
 for(const op of ['generateScript','saveScript','changeStatus','copyScript','openPrompter','renderPlanner']){
  assert.ok(studio.includes('function '+op+'('),'Missing '+op);
 }
 for(const field of ['scheduled_for','published_url','isApprover()','wizardStep'])assert.ok(studio.includes(field),field);
});

test('premium toolkit includes functional browser tools and history',()=>{
 for(const key of ['proRewrite','proContentPack','proQuality','proThumbnail','proStartRecording','proStopRecording','proSrt','proTxt','proPrint','proHistory','proBrandSave','proCommentForm','proAnalytics','proFavorites','proWatchResults']){
  assert.ok(toolsHtml.includes('id="'+key+'"'),'Missing toolkit control '+key);
 }
 for(const fn of ['async function ai(','function subtitles(','function printScript(','function startRecording(','async function history(','function markFavorites(','function brandVoice(','async function postComment(','function teleprompterPro(']){
  assert.ok(toolsJS.includes(fn),'Missing toolkit function '+fn);
 }
 assert.match(toolsCSS,/@media\(max-width:760px\)/);
 assert.match(toolsJS,/MediaRecorder/);
 assert.match(toolsJS,/psp_content_script_versions/);
 assert.match(toolsJS,/psp_content_script_comments/);
});


test('mobile luxe layer is linked last and uses safe-area aware premium navigation',()=>{
 assert.match(html,/mobile-luxe-v8\.css/);
 assert.ok(html.indexOf('mobile-luxe-v8.css')>html.indexOf('signature-v7.css'));
 assert.match(luxeCSS,/studio-welcome/);
 assert.match(luxeCSS,/bottom-nav/);
 assert.match(luxeCSS,/env\(safe-area-inset-bottom/);
 assert.match(accessEdge,/SMTP_HOST/);
});
