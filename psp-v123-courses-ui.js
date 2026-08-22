(function(){
'use strict';
const BASIC_CLASSES=[
  ['FINANCIAL MARKETS BLUEPRINT','2026-08-10T21:00:00+05:00'],
  ['THE LANGUAGE OF PRICE INTELLIGENCE','2026-08-13T21:00:00+05:00'],
  ['DECODING AND DISSECTING CANDLESTICKS','2026-08-15T21:00:00+05:00'],
  ["EXPLORING TRADER'S TOOLKIT",'2026-08-17T21:00:00+05:00'],
  ['TRADING WITH MARKET PULSE','2026-08-18T21:00:00+05:00'],
  ['UNDERSTANDING REAL MARKET DRIVERS','2026-08-20T21:00:00+05:00'],
  ['ULTIMATE SUCCESS CODE — THE MINDSET','2026-08-24T21:00:00+05:00'],
  ['BUILDING YOUR TRADING EDGE','2026-08-25T21:00:00+05:00'],
  ['MASTER THE ART OF TRADING','2026-08-27T21:00:00+05:00']
];
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(iso){try{return new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Karachi',month:'short',day:'2-digit',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(iso)).replace(', 2026 at',', 2026 ·')+' PKT';}catch(_){return iso}}

function hideLegacyCourseOperations(){
  const page=document.getElementById('page-courses');if(!page)return;
  [...page.querySelectorAll('button')].forEach(btn=>{
    if(!/Manage Live Links/i.test(btn.textContent||''))return;
    let cur=btn.parentElement,candidate=null;
    while(cur&&cur!==page){
      const t=(cur.textContent||'').replace(/\s+/g,' ');
      const classes=(t.match(/CLASS\s*0?\d/gi)||[]).length;
      if(/Basic Forex Course/i.test(t)&&classes>=5){candidate=cur;break;}
      cur=cur.parentElement;
    }
    if(candidate&&!candidate.closest('#pspV123Schedule'))candidate.style.display='none';
  });
  [...page.querySelectorAll('div,section,article')].forEach(el=>{
    if(el.id==='pspV123Schedule'||el.closest('#pspV123Schedule'))return;
    const t=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!/Courses\s*&\s*Live Classes/i.test(t))return;
    if(t.length>1100)return;
    const b=[...el.querySelectorAll('button')].map(x=>(x.textContent||'').trim()).join(' ');
    if(/Enrollments/i.test(b)&&/Refresh/i.test(b))el.style.display='none';
  });
}
function renderSchedule(){
  const page=document.getElementById('page-courses');if(!page)return;
  hideLegacyCourseOperations();
  let wrap=document.getElementById('pspV123Schedule');
  if(!wrap){
    wrap=document.createElement('section');wrap.id='pspV123Schedule';wrap.className='psp-v123-live-wrap';
    const stats=page.querySelector('.stats-grid');(stats||page.firstElementChild)?.insertAdjacentElement(stats?'beforebegin':'afterend',wrap);
  }
  const now=Date.now();let nextIndex=BASIC_CLASSES.findIndex(x=>new Date(x[1]).getTime()>now);
  wrap.innerHTML=`<div class="psp-v123-live-head"><div class="copy"><div class="psp-v123-kicker">Live Learning</div><h3>Basic Forex Course — Class Schedule</h3><p>9 classes · 9:00 PM PKT · compact schedule overview</p></div><div class="psp-v123-live-actions"><button class="btn btn-secondary" type="button" onclick="openSystemCourseEnrollments('free')">Enrollments</button><button class="btn btn-secondary" type="button" onclick="pspV123RenderSchedule()">Refresh</button><button class="btn" type="button" onclick="openCourseClassesManager('basic')">Manage Live Links</button></div></div><div class="psp-v123-live-grid">${BASIC_CLASSES.map((row,i)=>{const tm=new Date(row[1]).getTime();let state='upcoming',label='Upcoming';if(tm<now){state='done';label='Completed'}else if(i===nextIndex){state='next';label='Next'}return `<div class="psp-v123-class"><span class="psp-v123-class-no">${String(i+1).padStart(2,'0')}</span><div class="psp-v123-class-copy"><b>${esc(row[0])}</b><small>${esc(fmt(row[1]))}</small></div><span class="psp-v123-state ${state}">${label}</span></div>`}).join('')}</div>`;
}
window.pspV123RenderSchedule=renderSchedule;

function field(id){const e=document.getElementById(id);return e?.closest('.form-group')||null}
function append(panel,node,wide){if(!panel||!node)return;if(wide)node.classList.add('psp-v123-wide');panel.appendChild(node)}
function buildEditorTabs(){
  const overlay=document.getElementById('modal-courseForm'),modal=overlay?.querySelector('.modal-lg');if(!modal||!overlay.classList.contains('active'))return;
  if(document.getElementById('pspV123CourseTabs')){activateTab('basic');return;}
  const editor=document.getElementById('pspV20CourseEditor');if(!editor)return setTimeout(buildEditorTabs,60);
  const error=document.getElementById('courseFormError');
  const tabs=document.createElement('div');tabs.id='pspV123CourseTabs';tabs.className='psp-v123-editor-tabs';
  const defs=[['basic','Basic Info'],['access','Pricing & Access'],['page','Page Content'],['learning','Learning'],['modules','Modules']];
  tabs.innerHTML=defs.map(([k,l])=>`<button type="button" class="psp-v123-editor-tab" data-tab="${k}">${l}</button>`).join('');
  const panels=document.createElement('div');panels.className='psp-v123-editor-panels';
  defs.forEach(([k])=>{const p=document.createElement('div');p.className='psp-v123-editor-panel '+k;p.dataset.panel=k;panels.appendChild(p)});
  error.insertAdjacentElement('afterend',tabs);tabs.insertAdjacentElement('afterend',panels);
  const p=k=>panels.querySelector(`[data-panel="${k}"]`);

  // Basic information.
  append(p('basic'),field('courseTitle'));
  append(p('basic'),field('courseDescription'),true);
  append(p('basic'),field('courseLevel'));
  append(p('basic'),field('courseCategory'));
  append(p('basic'),field('courseThumbFile'),true);
  append(p('basic'),field('courseOrder'));

  // Pricing/access controls.
  ['coursePrice','courseLocalBankPrice','v20CourseKey','v20OldPrice','v20CourseBadge','v20AccessLabel','v20BuyNote','v20ActionButton','v20ContentNote','v20SecureNote'].forEach(id=>append(p('access'),field(id)));
  const pub=document.getElementById('coursePublished'),prem=document.getElementById('coursePremium');
  const switchWrap=pub?.closest('div');if(switchWrap&&switchWrap.contains(prem)){switchWrap.classList.add('psp-v123-switches');p('access').appendChild(switchWrap)}

  // Course-page text + mentor/headings.
  ['v20ShortDescription','v20DescriptionExtra','v20MentorName','v20MentorTitle','v20LearningHeading','v20OutcomesHeading','v20ContentHeading','v20RequirementsHeading','v20AudienceHeading','v20DescriptionHeading','v20RelatedHeading'].forEach(id=>append(p('page'),field(id),['v20ShortDescription','v20DescriptionExtra'].includes(id)));

  // Learning sections and module builder.
  ['included','learning','outcomes','requirements','audience'].forEach(k=>{const s=document.getElementById('pspV20List-'+k)?.closest('.psp-v20-editor-section');if(s)p('learning').appendChild(s)});
  const mod=document.getElementById('pspV20Modules')?.closest('.psp-v20-editor-section');if(mod)p('modules').appendChild(mod);

  // Remove empty layout shells left behind after moving the real controls.
  [...modal.querySelectorAll('.form-row,.psp-v20-editor-grid,#pspV20CourseEditor')].forEach(x=>{if(!x.querySelector('input:not([type="hidden"]),textarea,select,.psp-v20-editor-section'))x.style.display='none'});
  const footer=document.getElementById('saveCourseBtn')?.parentElement;if(footer)footer.classList.add('psp-v123-course-footer');
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)activateTab(b.dataset.tab)});
  activateTab('basic');
}
function activateTab(key){
  document.querySelectorAll('#modal-courseForm .psp-v123-editor-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===key));
  document.querySelectorAll('#modal-courseForm .psp-v123-editor-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===key));
}

function init(){
  renderSchedule();
  const page=document.getElementById('page-courses');
  if(page&&window.MutationObserver){new MutationObserver(()=>{clearTimeout(window.__v123CourseT);window.__v123CourseT=setTimeout(()=>{renderSchedule();},70)}).observe(page,{childList:true,subtree:true});}
  const modal=document.getElementById('modal-courseForm');
  if(modal&&window.MutationObserver){new MutationObserver(()=>{if(modal.classList.contains('active'))setTimeout(buildEditorTabs,80)}).observe(modal,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});}
  setTimeout(renderSchedule,500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
