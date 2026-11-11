/* PipSePaisa mobile usability fixes v5 — UI-only, private access untouched */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const EDITORS=['hook','explanation','market_impact','closing','cta'];
let schedule=null,backdrop=null;
function autoSize(el){
 if(!el||!el.isConnected||el.offsetParent===null)return;
 el.style.height='auto';
 const height=Math.max(96,Math.ceil(el.scrollHeight)+3);
 el.style.height=height+'px';
 el.style.overflowY='hidden';
}
function sizeEditors(){
 for(const id of EDITORS)autoSize($(id));
}
function scheduleSize(){
 if(schedule!==null)cancelAnimationFrame(schedule);
 schedule=requestAnimationFrame(()=>{schedule=null;sizeEditors()});
}
function menuState(){
 const rail=$('studioRail'),mobile=$('mobileNav');
 if(!rail)return;
 const open=rail.classList.contains('open');
 if(backdrop)backdrop.hidden=!open;
 if(mobile)mobile.setAttribute('aria-expanded',open?'true':'false');
 document.documentElement.classList.toggle('studio-menu-open',open&&window.matchMedia('(max-width:700px)').matches);
}
function closeMenu(){
 $('studioRail')?.classList.remove('open');
 menuState();
}
function setupMenu(){
 const rail=$('studioRail'),studio=$('studioApp'),toggle=$('mobileNav');
 if(!rail||!studio||!toggle)return;
 backdrop=document.createElement('button');
 backdrop.id='studioNavBackdrop';
 backdrop.type='button';
 backdrop.hidden=true;
 backdrop.setAttribute('aria-label','Close navigation');
 backdrop.addEventListener('click',closeMenu);
 studio.append(backdrop);
 toggle.setAttribute('aria-expanded','false');
 toggle.setAttribute('aria-controls','studioRail');
 toggle.addEventListener('click',()=>requestAnimationFrame(menuState));
 rail.querySelectorAll('.navbtn').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(menuState)));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
 window.addEventListener('resize',menuState,{passive:true});
 if(typeof MutationObserver!=='undefined'){
  const observer=new MutationObserver(menuState);
  observer.observe(rail,{attributes:true,attributeFilter:['class']});
 }
 menuState();
}
function cleanScriptStatus(){
 // A saved/generated script may be filled programmatically. Its textarea
 // contents do not emit input events, so refresh after workflow events.
 scheduleSize();
}
function init(){
 for(const id of EDITORS){
  const field=$(id);if(!field)continue;
  field.addEventListener('input',scheduleSize);
  const parent=field.closest('details');
  if(parent)parent.addEventListener('toggle',scheduleSize);
 }
 ['psp-studio-script-generated','psp-studio-script-loaded','psp-studio-script-cleared',
  'psp-studio-pro-tools-ui-ready','psp-studio-page'].forEach(event=>{
   document.addEventListener(event,cleanScriptStatus);
  });
 if($('editorScreen')){
  document.querySelectorAll('#editorScreen details').forEach(d=>d.addEventListener('toggle',scheduleSize));
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleSize()});
 setupMenu();
 scheduleSize();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();