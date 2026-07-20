
const cfg = window.PSP_CONFIG || {};
const hasSupabase = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("PASTE_");
const sb = hasSupabase && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
function toast(msg){ const old=$('.toast'); if(old) old.remove(); const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),3200); }
function money(n){ return new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(n||0)); }
function fmtDate(v){ if(!v) return '-'; return new Date(v).toLocaleString(); }
function setTheme(){ document.body.classList.toggle('light', localStorage.getItem('psp_theme')==='light'); }
function toggleTheme(){ localStorage.setItem('psp_theme', document.body.classList.contains('light')?'dark':'light'); setTheme(); }
setTheme();

async function currentUser(){
  if(!sb) return null;
  const {data:{user}} = await sb.auth.getUser();
  return user || null;
}
async function currentProfile(){
  const u=await currentUser(); if(!u) return null;
  const {data}=await sb.from('profiles').select('*').eq('id',u.id).single();
  return data;
}
async function requireRole(roles=[]){
  if(!sb){ toast('Supabase publishable key config.js me add karein.'); return null; }
  const p=await currentProfile();
  if(!p){ location.href='login.html'; return null; }
  if(roles.length && !roles.includes(p.role)){ location.href = p.role==='admin'?'admin.html':p.role==='mentor'?'mentor.html':'user.html'; return null; }
  return p;
}
async function logout(){ if(sb) await sb.auth.signOut(); location.href='login.html'; }

function bindShell(){
  $('.theme-toggle')?.addEventListener('click',toggleTheme);
  $('.logout-btn')?.addEventListener('click',logout);
  $('.mobile-menu')?.addEventListener('click',()=>$('.sidebar')?.classList.toggle('open'));
  $$('.side-nav button[data-page]').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.side-nav button').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    $$('.page-view').forEach(v=>v.classList.add('hidden'));
    $('#'+btn.dataset.page)?.classList.remove('hidden');
    $('.sidebar')?.classList.remove('open');
  }));
}
function openModal(id){ $('#'+id)?.classList.remove('hidden'); }
function closeModal(id){ $('#'+id)?.classList.add('hidden'); }
window.PSP={sb,hasSupabase,currentUser,currentProfile,requireRole,logout,toast,money,fmtDate,bindShell,openModal,closeModal,toggleTheme};
