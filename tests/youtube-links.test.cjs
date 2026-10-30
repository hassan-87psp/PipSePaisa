'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('psp-youtube-links-v1.js');
test('YouTube links script syntax is valid, channel URLs validated, repeated render guarded',()=>{
 assert.doesNotThrow(()=>new vm.Script(src));
 assert.ok(src.includes("window.__pspYoutubeLinksV1=true"));
 assert.ok(src.includes('https://www.youtube.com/@pipsepaisa'));
 assert.ok(src.includes("u.protocol!=='https:'"));
 assert.ok(src.includes("host==='www.youtube.com'"));
 assert.ok(src.includes("target='_blank'"));
 assert.ok(src.includes("MutationObserver(add)"));
});
test('Home community displays channel and Courses footer icon uses actual channel link',()=>{
 const home=read('index.html'),courses=read('courses/index.html');
 assert.ok(home.includes('class="social-platform youtube" data-psp-youtube="1"'));
 assert.ok(home.includes('Free Forex Lessons &amp; Market Education'));
 assert.ok(home.includes('class="social-grid social-grid-three psp-youtube-grid"'));
 assert.ok(courses.includes('aria-label="YouTube" data-psp-youtube="1" href="https://www.youtube.com/@pipsepaisa"'));
});
test('Public pages expose channel social CTA and footer without altering main navigation',()=>{
 for(const file of ['index.html','courses/index.html','broker-reviews/index.html','becomepartner/index.html','tradingtools/index.html','about-us/index.html','contact/index.html','sign-in/index.html','sign-up/index.html','partner.html','courses.html','tools-services.html','broker-reviews.html','become-partner/index.html','mentors/index.html','learn/index.html']){
  assert.ok(read(file).includes('psp-youtube-links-v1.js?v=20261030-v1'),file);
 }
 assert.ok(src.includes('footer .footer-socials'));
 assert.ok(src.includes("footer .footer-grid"));
 assert.ok(src.includes("a[aria-label=\"YouTube\"]"));
});
test('User Mentor Admin support YouTube access without taking over compact mobile nav',()=>{
 for(const file of ['dashboard/index.html','signals/index.html','journal/index.html','performance/index.html','my-courses/index.html','profile/index.html','member-chats/index.html','ai-tools/index.html','ai-report/index.html','world-news/index.html','charts-articles/index.html','my-trades/index.html','support/index.html','currency-strength/index.html','economic-news/index.html','live-charts/index.html','trades-analysis/index.html','eaindicator/index.html','announcements/index.html','tools/index.html','about/index.html','psp-mentor.html','admin/index.html','admin-panel.html']){
  assert.ok(read(file).includes('psp-youtube-links-v1.js?v=20261030-v1'),file);
 }
 assert.ok(src.includes('#mainApp #sidebar .sidebar-footer'));
 assert.ok(src.includes('#page-about a[title="Instagram"]'));
 assert.ok(src.includes("document.getElementById('mDrawerList')"));
 assert.ok(src.includes("var foot=document.querySelector('.sidebar-footer')"));
 assert.ok(!src.includes('#userBottomNav .ubn-item'),'mobile navigation remains unchanged');
});
test('Admin can save official YouTube channel and front-end uses configured URL',()=>{
 for(const page of ['admin/index.html','admin-panel.html']){
  assert.ok(read(page).includes('id="lsYoutube"'));
  assert.ok(read(page).includes('admin-core-v406.js?v=20261030-v524-youtube-links'));
 }
 const core=read('admin-core-v406.js');
 assert.ok(core.includes("youtube:youtube"));
 assert.ok(core.includes("k==='youtube'?'lsYoutube'"));
 assert.ok(core.includes('Enter a valid YouTube channel link'));
 assert.ok(src.includes("LANDING_SOCIAL|youtube"));
 assert.ok(src.includes("var url=r.data&&r.data[0]&&verified(r.data[0].description)"));
});
