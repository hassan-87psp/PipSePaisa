(function(){
'use strict';
if(window.__pspAdLinkUiV271)return;
window.__pspAdLinkUiV271=true;

const STORE_PREFIX='pspAdLinkTeamPassword:';
let pendingCreate=null;
let pendingResetUsername='';
let observer=null;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
function qsa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
function text(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
function getPw(username){try{return localStorage.getItem(STORE_PREFIX+username)||'';}catch(_){return '';}}
function setPw(username,password){try{if(username&&password)localStorage.setItem(STORE_PREFIX+username,password);}catch(_){}}
function parseUsername(str){const m=String(str||'').match(/@([a-zA-Z0-9._-]+)/);return m?m[1]:'';}
function headingByText(re){return qsa('h1,h2,h3,h4,h5,h6,div,span').find(el=>re.test(text(el)));}
function closestCardByTitle(re){const head=headingByText(re);if(!head)return null;return head.closest('.card, .panel, section, .box, .widget')||head.parentElement?.parentElement||null;}

function injectStyles(){
  if(document.getElementById('pspAdLinkUiV271Styles'))return;
  const s=document.createElement('style');
  s.id='pspAdLinkUiV271Styles';
  s.textContent=`
  .psp271-card{border-radius:20px!important;overflow:hidden!important;box-shadow:0 12px 36px rgba(15,23,42,.06)!important}
  .psp271-card .card-title,.psp271-card h3{font-size:28px!important;line-height:1.1!important}
  .psp271-card .card-meta{font-size:12px!important;line-height:1.55!important}
  .psp271-create-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .psp271-pill-note{margin-top:12px;padding:12px 14px;border:1px solid rgba(16,185,129,.25);background:rgba(16,185,129,.06);border-radius:12px;color:#64748b;font-size:12px;line-height:1.6}
  .psp271-table-wrap{overflow:auto;border:1px solid var(--border,#e9d8ad);border-radius:16px;background:#fffaf2}
  .psp271-table{width:100%;min-width:1180px;border-collapse:separate;border-spacing:0}
  .psp271-table thead th{position:sticky;top:0;background:#f8f1e3;z-index:1;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#7c6d56;padding:14px 12px;border-bottom:1px solid #ecd9b1;white-space:nowrap}
  .psp271-table tbody td{padding:14px 12px;border-bottom:1px solid #f1e4c7;vertical-align:top;background:#fff}
  .psp271-table tbody tr:nth-child(even) td{background:#fffdf8}
  .psp271-table tbody tr:hover td{background:#fff8ec}
  .psp271-name{font-weight:800;color:#1f2937;font-size:14px;line-height:1.3}
  .psp271-sub{display:block;margin-top:4px;font-size:11px;color:#74839a;line-height:1.4}
  .psp271-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:#f7f0e2;border:1px solid #ecd9b1;font-size:11px;font-weight:700;color:#7a5c1f;white-space:nowrap}
  .psp271-chip.off{background:#fff1f1;border-color:#f4c1c1;color:#c24141}
  .psp271-chip.on{background:#edfdf4;border-color:#bbf7d0;color:#15803d}
  .psp271-login-user{font-weight:800;color:#0f172a;font-size:13px}
  .psp271-login-pass{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,monospace;font-size:12px;color:#111827;word-break:break-all}
  .psp271-pass-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  .psp271-mini-btn{border:1px solid #e7c98d;background:#fff7e5;color:#8b5e08;border-radius:8px;padding:5px 8px;font-size:10px;font-weight:800;cursor:pointer}
  .psp271-mini-btn:hover{background:#fff1ce}
  .psp271-muted{color:#94a3b8;font-size:11px;line-height:1.4}
  .psp271-count{font-weight:800;font-size:15px;color:#111827}
  .psp271-course-break{font-size:11px;color:#7c6d56;margin-top:4px;line-height:1.45}
  .psp271-actions{display:flex;flex-wrap:wrap;gap:6px}
  .psp271-actions button{white-space:nowrap}
  .psp271-hint{margin:0 0 14px;padding:12px 14px;border-radius:12px;border:1px solid rgba(248,135,2,.25);background:rgba(248,135,2,.07);font-size:12px;line-height:1.6;color:#5b6474}
  .psp271-hint b{color:#1f2937}
  .psp271-compact-form input,.psp271-compact-form select{border-radius:12px!important;padding:12px 14px!important}
  @media (max-width:900px){
    .psp271-create-grid{grid-template-columns:1fr}
    .psp271-card .card-title,.psp271-card h3{font-size:22px!important}
  }
  `;
  document.head.appendChild(s);
}

function beautifyCreateSection(){
  const card=closestCardByTitle(/Create Team Panel Account/i);
  if(!card||card.dataset.psp271CreateDone)return;
  card.dataset.psp271CreateDone='1';
  card.classList.add('psp271-card','psp271-compact-form');
  const note=qsa('div, p',card).find(el=>/Fresh system only|Historical data included|No personal course link/i.test(text(el)));
  if(note)note.classList.add('psp271-pill-note');
}

function renderPasswordCell(username){
  const pw=getPw(username);
  if(!pw){
    return `<div class="psp271-muted"><span class="psp271-chip">Hidden</span><div class="psp271-course-break">Old accounts do not show plaintext password. Use <b>New Password</b> when needed.</div></div>`;
  }
  const masked='•'.repeat(Math.max(6, Math.min(10,pw.length)));
  return `<div class="psp271-login-pass" data-plain="${esc(pw)}" data-visible="0">${masked}</div>
    <div class="psp271-pass-actions">
      <button type="button" class="psp271-mini-btn" data-psp271-pass-toggle="${esc(username)}">Show</button>
      <button type="button" class="psp271-mini-btn" data-psp271-pass-copy="${esc(username)}">Copy</button>
    </div>
    <div class="psp271-course-break">Saved in this browser after create/reset.</div>`;
}

function upgradeTeamTable(){
  const card=closestCardByTitle(/Round-?Robin Team Members/i)||closestCardByTitle(/Ad Link Team Routing/i);
  if(!card)return;
  card.classList.add('psp271-card');
  if(!card.querySelector('.psp271-hint')){
    const hint=document.createElement('div');
    hint.className='psp271-hint';
    hint.innerHTML='<b>Better login visibility:</b> Username is shown directly here. Password is shown only after you create the account or reset it from this admin panel. Older accounts stay hidden until you set a new password.';
    const header=card.querySelector('.card-header')||card.firstElementChild;
    if(header&&header.parentNode===card) header.insertAdjacentElement('afterend',hint);
    else card.insertBefore(hint,card.firstChild);
  }
  const table=card.querySelector('table');
  if(!table)return;
  const wrap=table.parentElement;
  if(wrap && !wrap.classList.contains('psp271-table-wrap')){
    const holder=document.createElement('div');
    holder.className='psp271-table-wrap';
    wrap.parentNode.insertBefore(holder,wrap);
    holder.appendChild(table);
    if(wrap!==table && !wrap.children.length) wrap.remove();
  }
  table.classList.add('psp271-table');

  const headRow=table.tHead?table.tHead.rows[0]:table.querySelector('tr');
  if(headRow && !headRow.dataset.psp271Upgraded){
    headRow.dataset.psp271Upgraded='1';
    const ths=headRow.children;
    if(ths.length>=6 && !headRow.querySelector('[data-col="username"]')){
      const userTh=document.createElement('th'); userTh.dataset.col='username'; userTh.textContent='Username';
      const passTh=document.createElement('th'); passTh.dataset.col='password'; passTh.textContent='Password';
      headRow.insertBefore(userTh, ths[1]||null);
      headRow.insertBefore(passTh, ths[2]||null);
    }
  }

  qsa('tbody tr',table).forEach(function(tr){
    if(tr.dataset.psp271Done)return;
    const cells=tr.children;
    if(cells.length<6)return;
    tr.dataset.psp271Done='1';
    const teamCell=cells[0];
    const whatsappCell=cells[1];
    const leadsCell=cells[2];
    const assignedCell=cells[3];
    const accountCell=cells[4];
    const actionsCell=cells[5];
    const rowText=text(teamCell);
    const username=parseUsername(rowText);

    const lines=teamCell.innerHTML.split(/<br\s*\/?\s*>/i);
    teamCell.innerHTML=`<div class="psp271-name">${esc(text(teamCell).split('@')[0].trim() || 'Team Member')}</div><span class="psp271-sub">Round-robin lead receiver</span>`;

    const userTd=document.createElement('td');
    userTd.innerHTML=`<div class="psp271-login-user">${username?('@'+esc(username)):'—'}</div><div class="psp271-course-break">Team panel login username</div>`;
    tr.insertBefore(userTd, whatsappCell);

    const passTd=document.createElement('td');
    passTd.innerHTML=renderPasswordCell(username);
    tr.insertBefore(passTd, whatsappCell);

    const wa=text(whatsappCell);
    whatsappCell.innerHTML=`<div class="psp271-count">${esc(wa||'—')}</div><div class="psp271-course-break">Active WhatsApp</div>`;

    const isOn=/ON/i.test(text(leadsCell));
    leadsCell.innerHTML=`<span class="psp271-chip ${isOn?'on':'off'}">${isOn?'ON':'OFF'}</span><div class="psp271-course-break">New lead assignment</div>`;

    const assignText=text(assignedCell);
    assignedCell.innerHTML=`<div class="psp271-count">${esc(assignText.split(' ')[0]||assignText||'0')}</div><div class="psp271-course-break">${esc(assignText.replace(/^\d+\s*/,'')||'Sajid / Fundamental lead split')}</div>`;

    const accText=text(accountCell);
    const active=/active/i.test(accText);
    accountCell.innerHTML=`<span class="psp271-chip ${active?'on':'off'}">${active?'Active':'Disabled'}</span><div class="psp271-course-break">Team panel account</div>`;

    actionsCell.classList.add('psp271-actions');
  });
}

function attachPasswordButtons(){
  document.addEventListener('click', async function(e){
    const toggle=e.target.closest('[data-psp271-pass-toggle]');
    if(toggle){
      const td=toggle.closest('td');
      const val=td&&td.querySelector('.psp271-login-pass');
      if(!val)return;
      const plain=val.getAttribute('data-plain')||'';
      const visible=val.getAttribute('data-visible')==='1';
      if(visible){val.textContent='•'.repeat(Math.max(6, Math.min(10, plain.length)));val.setAttribute('data-visible','0');toggle.textContent='Show';}
      else {val.textContent=plain;val.setAttribute('data-visible','1');toggle.textContent='Hide';}
      return;
    }
    const copy=e.target.closest('[data-psp271-pass-copy]');
    if(copy){
      const username=copy.getAttribute('data-psp271-pass-copy');
      const pw=getPw(username);
      if(!pw)return;
      try{await navigator.clipboard.writeText(pw);}catch(_){const t=document.createElement('textarea');t.value=pw;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}
      copy.textContent='Copied'; setTimeout(()=>copy.textContent='Copy',1200);
      return;
    }

    const createBtn=e.target.closest('button');
    if(createBtn && /Create Team Account/i.test(text(createBtn))){
      const card=closestCardByTitle(/Create Team Panel Account/i);
      if(card){
        const inputs=qsa('input',card);
        const usernameInput=inputs.find(i=>/username/i.test(i.id||i.name||'')||/username/i.test((i.previousElementSibling&&text(i.previousElementSibling))||''));
        const passwordInput=inputs.find(i=>/password/i.test(i.id||i.name||'')||i.type==='password');
        pendingCreate={username: usernameInput?usernameInput.value.trim().replace(/^@/,''):'', password: passwordInput?passwordInput.value:''};
        if(pendingCreate.username && pendingCreate.password){setTimeout(function(){setPw(pendingCreate.username,pendingCreate.password);scan();},1200);}
      }
    }

    if(createBtn && /New Password/i.test(text(createBtn))){
      const row=createBtn.closest('tr');
      if(row){
        const cell=row.children[1]||row.children[0];
        pendingResetUsername=parseUsername(text(cell)) || parseUsername(text(row));
      }
    }

    if(createBtn && /Save|Update|Set/i.test(text(createBtn))){
      if(!pendingResetUsername) return;
      setTimeout(function(){
        const pwInput=qsa('input[type="password"], input').find(i=>/password/i.test(i.id||i.name||'') && i.value && i.value.length>=6);
        if(pwInput && pendingResetUsername){setPw(pendingResetUsername,pwInput.value);scan();}
      },500);
    }
  }, true);
}

function scan(){
  injectStyles();
  beautifyCreateSection();
  upgradeTeamTable();
}

function boot(){
  attachPasswordButtons();
  scan();
  if(observer)observer.disconnect();
  observer=new MutationObserver(function(){scan();});
  observer.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
