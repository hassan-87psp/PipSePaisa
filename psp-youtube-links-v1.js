/* PipSePaisa YouTube access links V1: public + member + mentor + admin. */
(function(){
'use strict';
if(window.__pspYoutubeLinksV1)return;
window.__pspYoutubeLinksV1=true;
var channel='https://www.youtube.com/@pipsepaisa';
var icon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" focusable="false"><path d="M23 7.3a3 3 0 0 0-2.1-2.1C19 4.7 12 4.7 12 4.7s-7 0-8.9.5A3 3 0 0 0 1 7.3 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.7 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.7 31 31 0 0 0-.5-4.7zM9.7 15.5v-7L16 12l-6.3 3.5z"/></svg>';
function verified(input){
 try{
  var u=new URL(String(input||'').trim());
  var host=u.hostname.toLowerCase();
  if(u.protocol!=='https:'||!(host==='youtube.com'||host==='www.youtube.com'||host==='m.youtube.com'))return '';
  if(!/^\/(@[a-z0-9._-]+|channel\/[a-z0-9_-]+|c\/[a-z0-9._-]+|user\/[a-z0-9._-]+)\/?$/i.test(u.pathname))return '';
  return 'https://www.youtube.com'+u.pathname;
 }catch(e){return '';}
}
function link(cls,label){
 var a=document.createElement('a');a.className=cls;a.setAttribute('data-psp-youtube','1');
 a.href=channel;a.target='_blank';a.rel='noopener noreferrer';a.title='PipSePaisa YouTube';
 a.setAttribute('aria-label','PipSePaisa YouTube channel');if(label)a.textContent=label;return a;
}
function refresh(){
 document.querySelectorAll('[data-psp-youtube="1"]').forEach(function(a){a.href=channel;});
 var meta=document.querySelector('#pspSiteSchemaV475');
 if(meta){try{var data=JSON.parse(meta.textContent);var graph=data['@graph']||[];var org=graph.find(function(x){return x['@type']==='Organization';});if(org){org.sameAs=Array.from(new Set((org.sameAs||[]).concat([channel])));meta.textContent=JSON.stringify(data);}}catch(e){}}
}
function injectCss(){
 if(document.getElementById('pspYoutubeLinksStyle'))return;
 var css=document.createElement('style');css.id='pspYoutubeLinksStyle';
 css.textContent='.psp-youtube-icon{display:inline-flex;align-items:center;justify-content:center;min-width:32px;min-height:32px}.psp-youtube-icon svg{width:18px;height:18px}.psp-yt-sidebar{color:inherit;text-decoration:none;display:flex;align-items:center;gap:9px}.psp-yt-sidebar:hover{color:#e11d48}.psp-yt-sidebar .psp-yt-icon{display:inline-flex;align-items:center;justify-content:center;background:#fce7e7;color:#e11d48;border-radius:8px;width:29px;height:29px;flex-shrink:0}.psp-yt-sidebar .psp-yt-icon svg{width:17px;height:17px}.psp-yt-about{background:#e42338!important;color:white!important}.psp-yt-about svg{width:18px;height:18px;fill:white}.social-grid.psp-youtube-grid{grid-template-columns:repeat(4,minmax(0,1fr));max-width:1250px}.social-card.youtube .social-icon,.social-platform.youtube .social-icon{background:linear-gradient(135deg,#fa2740,#d50e26);color:white}.social-card.youtube svg,.social-platform.youtube svg{width:28px;height:28px;fill:white}.footer-socials .psp-youtube-icon{background:#e32236;color:#fff}.footer-socials .psp-youtube-icon svg{fill:currentColor}.psp-youtube-footer-text{font-size:inherit}.drw-item.psp-yt-drawer{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit}.drw-item.psp-yt-drawer svg{width:19px;height:19px;fill:#e52235}@media(max-width:900px){.social-grid.psp-youtube-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:540px){.social-grid.psp-youtube-grid{grid-template-columns:1fr}}';
 document.head.appendChild(css);
}
function publicArea(){
 var grid=document.querySelector('#mainApp, #app')?null:document.querySelector('.social-grid');
 if(grid&&!grid.querySelector('[data-psp-youtube]')){
  var exemplar=grid.querySelector('.social-platform');
  var card=link(exemplar?'social-platform youtube':'social-card youtube','');
  var ico=document.createElement('div');ico.className='social-icon';ico.innerHTML=icon;
  var h=document.createElement('h3');h.textContent='YouTube';
  var p=document.createElement('p');p.textContent='Free Forex Lessons & Market Education';
  card.appendChild(ico);card.appendChild(h);card.appendChild(p);
  grid.appendChild(card);grid.classList.add('psp-youtube-grid');
 }
 document.querySelectorAll('footer .footer-socials').forEach(function(bar){
  if(bar.querySelector('[data-psp-youtube], a[aria-label="YouTube"], a[title="YouTube"]'))return;
  var a=link('psp-youtube-icon','');a.innerHTML=icon;
  if(!bar.classList.contains('footer-socials'))return;
  bar.appendChild(a);
 });
 document.querySelectorAll('footer .footer-grid').forEach(function(foot){
  if(foot.querySelector('[data-psp-youtube-text]'))return;
  var contact=Array.from(foot.querySelectorAll('h3,h4')).find(function(h){return /contact/i.test(h.textContent);});
  var ul=contact&&contact.parentElement&&contact.parentElement.querySelector('ul');
  if(ul){var li=document.createElement('li');var a=link('psp-youtube-footer-text','YouTube Channel');li.setAttribute('data-psp-youtube-text','1');li.appendChild(a);ul.appendChild(li);}
 });
 document.querySelectorAll('footer a[aria-label="YouTube"],footer a[title="YouTube"]').forEach(function(a){a.href=channel;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('data-psp-youtube','1');});
}
function memberArea(){
 var side=document.querySelector('#mainApp #sidebar .sidebar-footer');
 if(side&&!side.querySelector('[data-psp-youtube]')){
  var a=link('menu-item psp-yt-sidebar','');a.innerHTML='<span class="menu-icon">▶️</span><strong>YouTube Lessons</strong>';
  var about=side.querySelector('[data-page="about"]');side.insertBefore(a,about||side.firstElementChild);
 }
 var aboutBlock=document.querySelector('#page-about a[title="Instagram"]');
 if(aboutBlock&&aboutBlock.parentElement&&!aboutBlock.parentElement.querySelector('[data-psp-youtube]')){
  var a=link('psp-yt-about','');a.innerHTML=icon+'<span>YouTube</span>';
  a.style.cssText='display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border-radius:12px;font-weight:800;text-decoration:none;font-size:14px';
  aboutBlock.parentElement.appendChild(a);
 }
}
function mentorArea(){
 var side=document.querySelector('#app #sidebar > div:last-child');
 if(side&&!side.querySelector('[data-psp-youtube]')){
  var a=link('menu-item psp-yt-sidebar','');a.innerHTML='<span>▶️</span> YouTube Lessons';
  side.insertBefore(a,side.lastElementChild);
 }
 var list=document.getElementById('mDrawerList');
 if(list){
  var add=function(){if(list.querySelector('[data-psp-youtube]'))return;var a=link('drw-item psp-yt-drawer','');a.innerHTML=icon+' YouTube Lessons';list.appendChild(a);};
  add();new MutationObserver(add).observe(list,{childList:true});
 }
}
function adminArea(){
 var foot=document.querySelector('.sidebar-footer');
 if(foot&&!foot.querySelector('[data-psp-youtube]')){
  var a=link('menu-item psp-yt-sidebar','');a.innerHTML='<span class="menu-icon">▶️</span> YouTube Channel';
  foot.insertBefore(a,foot.firstChild);
 }
}
async function readConfiguredChannel(){
 var client=null;
 try{if(typeof landingSb!=='undefined'&&landingSb&&typeof landingSb.from==='function')client=landingSb;}catch(e){}
 try{if(!client&&typeof sb!=='undefined'&&sb&&typeof sb.from==='function')client=sb;}catch(e){}
 if(!client)return;
 try{var r=await client.from('banners').select('description').eq('title','LANDING_SOCIAL|youtube').limit(1);var url=r.data&&r.data[0]&&verified(r.data[0].description);if(url){channel=url;refresh();}}catch(e){}
}
function init(){
 injectCss();publicArea();memberArea();mentorArea();adminArea();refresh();readConfiguredChannel();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();