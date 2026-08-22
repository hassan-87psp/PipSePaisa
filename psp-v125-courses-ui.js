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
    if(candidate&&!candidate.closest('#pspV124Schedule'))candidate.style.display='none';
  });
  [...page.querySelectorAll('div,section,article')].forEach(el=>{
    if(el.id==='pspV124Schedule'||el.closest('#pspV124Schedule'))return;
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
  let wrap=document.getElementById('pspV124Schedule');
  if(!wrap){
    wrap=document.createElement('section');wrap.id='pspV124Schedule';wrap.className='psp-v124-live-wrap';
    const stats=page.querySelector('.stats-grid');(stats||page.firstElementChild)?.insertAdjacentElement(stats?'beforebegin':'afterend',wrap);
  }
  const now=Date.now();let nextIndex=BASIC_CLASSES.findIndex(x=>new Date(x[1]).getTime()>now);
  const scheduleHtml=`<div class="psp-v124-live-head"><div class="copy"><div class="psp-v124-kicker">Live Learning</div><h3>Basic Forex Course — Class Schedule</h3><p>9 classes · 9:00 PM PKT · compact schedule overview</p></div><div class="psp-v124-live-actions"><button class="btn btn-secondary" type="button" onclick="openSystemCourseEnrollments('free')">Enrollments</button><button class="btn btn-secondary" type="button" onclick="pspV124RenderSchedule()">Refresh</button><button class="btn" type="button" onclick="openCourseClassesManager('basic')">Manage Live Links</button></div></div><div class="psp-v124-live-grid">${BASIC_CLASSES.map((row,i)=>{const tm=new Date(row[1]).getTime();let state='upcoming',label='Upcoming';if(tm<now){state='done';label='Completed'}else if(i===nextIndex){state='next';label='Next'}return `<div class="psp-v124-class"><span class="psp-v124-class-no">${String(i+1).padStart(2,'0')}</span><div class="psp-v124-class-copy"><b>${esc(row[0])}</b><small>${esc(fmt(row[1]))}</small></div><span class="psp-v124-state ${state}">${label}</span></div>`}).join('')}</div>`;
  if(wrap.innerHTML!==scheduleHtml)wrap.innerHTML=scheduleHtml;
}
window.pspV124RenderSchedule=renderSchedule;

function field(id){const e=document.getElementById(id);return e?.closest('.form-group')||null}
function moveField(grid,id,wide=false,extraClass=''){
  const node=field(id);if(!grid||!node)return null;
  if(wide)node.classList.add('psp-v125-wide');
  if(extraClass)node.classList.add(extraClass);
  grid.appendChild(node);return node;
}
function section(panel,title,sub=''){
  const s=document.createElement('section');s.className='psp-v125-section';
  s.innerHTML=`<div class="psp-v125-section-head"><div class="psp-v125-section-copy"><h3 class="psp-v125-section-title">${esc(title)}</h3>${sub?`<p class="psp-v125-section-sub">${esc(sub)}</p>`:''}</div></div><div class="psp-v125-grid"></div>`;
  panel.appendChild(s);return s.querySelector('.psp-v125-grid');
}
function currentCourseLabel(){
  const title=(document.getElementById('courseTitle')?.value||'').trim();
  return title||'New course';
}
function refreshEditorHeader(){
  const modal=document.querySelector('#modal-courseForm .modal-lg');if(!modal)return;
  const h2=document.getElementById('courseFormTitle');if(!h2)return;
  let wrap=modal.querySelector('.psp-v125-title-wrap');
  if(!wrap){
    wrap=document.createElement('div');wrap.className='psp-v125-title-wrap';
    const row=document.createElement('div');row.className='psp-v125-title-row';
    h2.parentElement.insertBefore(wrap,h2);wrap.appendChild(row);row.appendChild(h2);
    const badge=document.createElement('span');badge.className='psp-v125-status';badge.id='pspV125CourseStatus';row.appendChild(badge);
    const sub=document.createElement('div');sub.className='psp-v125-course-name';sub.id='pspV125CourseName';wrap.appendChild(sub);
  }
  const published=!!document.getElementById('coursePublished')?.checked;
  const status=document.getElementById('pspV125CourseStatus');if(status){status.textContent=published?'Active':'Draft';status.classList.toggle('draft',!published)}
  const name=document.getElementById('pspV125CourseName');if(name)name.textContent=currentCourseLabel()+' · Manage course content, access and publishing';
}
function syncThumbPreview(){
  const box=document.getElementById('pspV125ThumbPreview');if(!box)return;
  const source=document.querySelector('#courseThumbPrev img');
  const hidden=(document.getElementById('courseThumbnail')?.value||'').trim();
  const src=source?.src||hidden;
  box.innerHTML=src?`<img src="${esc(src)}" alt="Course thumbnail preview">`:'<span>1280 × 720<br>16:9 thumbnail preview</span>';
}
function buildThumbShell(node){
  if(!node||node.querySelector('.psp-v125-thumb-shell'))return;
  node.classList.add('psp-v125-thumb-field');
  const file=document.getElementById('courseThumbFile');if(!file)return;
  const hidden=document.getElementById('courseThumbnail');
  const prev=document.getElementById('courseThumbPrev');
  const helper=[...node.children].find(x=>x!==file&&x!==hidden&&x!==prev&&x.tagName!=='LABEL');
  const shell=document.createElement('div');shell.className='psp-v125-thumb-shell';
  const preview=document.createElement('div');preview.className='psp-v125-thumb-preview';preview.id='pspV125ThumbPreview';
  const tools=document.createElement('div');tools.className='psp-v125-thumb-tools';tools.innerHTML='<b>Course cover image</b><p>Use a clean 1280 × 720 image. The same cover appears across My Courses and related course cards.</p>';
  file.parentNode.insertBefore(shell,file);shell.append(preview,tools);tools.appendChild(file);
  if(helper)helper.style.display='none';
  if(prev)prev.style.display='none';
  file.addEventListener('change',()=>setTimeout(syncThumbPreview,180));
  if(prev&&window.MutationObserver)new MutationObserver(syncThumbPreview).observe(prev,{childList:true,subtree:true,attributes:true});
  syncThumbPreview();
}
function buildToggle(label,desc,input){
  const row=document.createElement('label');row.className='psp-v125-toggle';
  const copy=document.createElement('span');copy.className='psp-v125-toggle-copy';copy.innerHTML=`<b>${esc(label)}</b><small>${esc(desc)}</small>`;
  row.append(copy,input);return row;
}
function markDirty(){const s=document.getElementById('pspV125SaveState');if(s){s.textContent='Unsaved changes';s.classList.add('dirty')}}
function markClean(){const s=document.getElementById('pspV125SaveState');if(s){s.textContent='No unsaved changes';s.classList.remove('dirty')}}
function bindDirtyTracking(modal){
  if(modal.dataset.v125DirtyBound)return;modal.dataset.v125DirtyBound='1';
  modal.addEventListener('input',e=>{if(e.target.matches('input,textarea,select')){markDirty();if(e.target.id==='courseTitle'||e.target.id==='coursePublished')refreshEditorHeader()}});
  modal.addEventListener('change',e=>{if(e.target.matches('input,textarea,select')){markDirty();if(e.target.id==='coursePublished')refreshEditorHeader()}});
}
function makeFooter(){
  const save=document.getElementById('saveCourseBtn');if(!save)return;
  const old=save.parentElement;if(old?.classList.contains('psp-v125-course-footer'))return;
  const cancel=[...old.querySelectorAll('button')].find(b=>/cancel/i.test(b.textContent||''));
  const footer=document.createElement('div');footer.className='psp-v125-course-footer';
  footer.innerHTML='<span class="psp-v125-save-state" id="pspV125SaveState">No unsaved changes</span><div class="psp-v125-footer-actions"></div>';
  const actions=footer.querySelector('.psp-v125-footer-actions');if(cancel)actions.appendChild(cancel);actions.appendChild(save);
  old.parentElement.insertBefore(footer,old);old.remove();
  save.textContent='Save Changes';
}
function activateTab(key){
  document.querySelectorAll('#modal-courseForm .psp-v125-editor-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===key));
  document.querySelectorAll('#modal-courseForm .psp-v125-editor-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===key));
}
function buildEditorTabs(){
  const overlay=document.getElementById('modal-courseForm'),modal=overlay?.querySelector('.modal-lg');if(!modal||!overlay.classList.contains('active'))return;
  const existing=document.getElementById('pspV125CourseTabs');
  if(existing){refreshEditorHeader();syncThumbPreview();markClean();activateTab('overview');return;}
  const editor=document.getElementById('pspV20CourseEditor');if(!editor)return setTimeout(buildEditorTabs,60);
  const error=document.getElementById('courseFormError');if(!error)return;

  // Remove any stale V124 generated workspace if HTML was served from a cached previous build.
  document.getElementById('pspV124CourseTabs')?.remove();
  modal.querySelector('.psp-v124-editor-panels')?.remove();

  const defs=[['overview','Overview'],['access','Pricing & Access'],['content','Content'],['learning','Learning'],['modules','Modules'],['settings','Settings']];
  const tabs=document.createElement('div');tabs.id='pspV125CourseTabs';tabs.className='psp-v125-editor-tabs';
  tabs.innerHTML=defs.map(([k,l])=>`<button type="button" class="psp-v125-editor-tab" data-tab="${k}">${l}</button>`).join('');
  const panels=document.createElement('div');panels.className='psp-v125-editor-panels';
  defs.forEach(([k])=>{const p=document.createElement('div');p.className='psp-v125-editor-panel '+k;p.dataset.panel=k;panels.appendChild(p)});
  error.insertAdjacentElement('afterend',tabs);tabs.insertAdjacentElement('afterend',panels);
  const p=k=>panels.querySelector(`[data-panel="${k}"]`);

  // OVERVIEW — only the fields needed to identify and present the course.
  let g=section(p('overview'),'Course Details','Keep the core course information concise and easy to scan.');
  moveField(g,'courseTitle');moveField(g,'courseLevel');moveField(g,'courseCategory');moveField(g,'courseDescription',true);
  const thumb=moveField(g,'courseThumbFile',true);buildThumbShell(thumb);

  // PRICING & ACCESS — all commercial / enrollment-facing controls.
  g=section(p('access'),'Pricing','Set the public price and local bank checkout amount.');
  moveField(g,'coursePrice');moveField(g,'v20OldPrice');moveField(g,'courseLocalBankPrice');
  g=section(p('access'),'Enrollment & Access','Control the labels and messaging students see around enrollment.');
  ['v20CourseBadge','v20AccessLabel','v20BuyNote','v20ActionButton','v20ContentNote','v20SecureNote'].forEach(id=>moveField(g,id));

  // CONTENT — public course page copy, mentor, and page headings.
  g=section(p('content'),'Course Page Copy','Text used across the public course page and course cards.');
  moveField(g,'v20ShortDescription',true);moveField(g,'v20DescriptionExtra',true);
  g=section(p('content'),'Mentor','Instructor identity shown with this course.');
  moveField(g,'v20MentorName');moveField(g,'v20MentorTitle');
  g=section(p('content'),'Section Headings','Rename public course-page sections without changing their content.');
  ['v20LearningHeading','v20OutcomesHeading','v20ContentHeading','v20RequirementsHeading','v20AudienceHeading','v20DescriptionHeading','v20RelatedHeading'].forEach(id=>moveField(g,id));

  // LEARNING — preserve existing dynamic list builders.
  ['included','learning','outcomes','requirements','audience'].forEach(k=>{
    const s=document.getElementById('pspV20List-'+k)?.closest('.psp-v20-editor-section');if(s)p('learning').appendChild(s);
  });

  // MODULES — preserve module editor, reorder controls and content.
  const mod=document.getElementById('pspV20Modules')?.closest('.psp-v20-editor-section');if(mod)p('modules').appendChild(mod);

  // SETTINGS — system identity, optional media, visibility, ordering.
  g=section(p('settings'),'System Settings','Advanced settings used by the platform.');
  ['v20CourseKey','courseYoutubeUrl','courseOrder','courseEnrollments','courseEmoji','courseColor'].forEach(id=>moveField(g,id));
  const toggles=document.createElement('div');toggles.className='psp-v125-toggle-row psp-v125-wide';
  const published=document.getElementById('coursePublished'),premium=document.getElementById('coursePremium');
  if(published)toggles.appendChild(buildToggle('Published','Visible to users and available for enrollment.',published));
  if(premium)toggles.appendChild(buildToggle('Premium Only','Marks this course as premium/paid access.',premium));
  g.appendChild(toggles);

  // Hide empty structural shells after moving the original controls.
  [...modal.querySelectorAll('.form-row,#pspV20CourseEditor')].forEach(x=>{
    const has=x.querySelector('input:not([type="hidden"]),textarea,select,.psp-v20-editor-section');
    if(!has)x.classList.add('psp-v125-hidden-shell');
  });

  makeFooter();refreshEditorHeader();bindDirtyTracking(modal);markClean();syncThumbPreview();
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)activateTab(b.dataset.tab)});
  activateTab('overview');
}

function init(){
  renderSchedule();
  const page=document.getElementById('page-courses');
  if(page&&window.MutationObserver){new MutationObserver((mutations)=>{
    const external=mutations.some(m=>{const n=m.target&&m.target.nodeType===1?m.target:m.target&&m.target.parentElement;return !(n&&n.closest&&n.closest('#pspV124Schedule'));});
    if(!external)return;clearTimeout(window.__v125CourseT);window.__v125CourseT=setTimeout(renderSchedule,90);
  }).observe(page,{childList:true,subtree:true});}
  const modal=document.getElementById('modal-courseForm');
  if(modal&&window.MutationObserver){new MutationObserver(()=>{if(modal.classList.contains('active'))setTimeout(buildEditorTabs,90)}).observe(modal,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});}
  setTimeout(renderSchedule,500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
