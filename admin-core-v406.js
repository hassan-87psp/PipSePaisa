
// ============ SUPABASE SETUP ============
const SUPABASE_URL = 'https://etfolhinohgmskbfjoyh.supabase.co'; // <-- naye Supabase project ka URL
const SUPABASE_KEY = 'sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw'; // <-- naye project ka anon key

let sb = null;
try {
  if (window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {auth:{storageKey:"pipsepaisa-admin-auth-v2",persistSession:true,autoRefreshToken:true}});
    window.sb = sb;
    window.adminSb = sb;
    console.log('✅ Supabase initialized');
  }
} catch (e) {
  console.error('Supabase init error:', e);
}

let currentAdmin = null;
let isLoggedIn = false;

// On load, check if already logged in
window.addEventListener('load', async () => {
  // Check for an existing admin session; otherwise show the login screen
  try {
    let user=null;
      try{const sr=await sb.auth.getSession();user=(sr&&sr.data&&sr.data.session)?sr.data.session.user:null;}catch(e){}
      if(!user){try{const ur=await sb.auth.getUser();user=(ur&&ur.data)?ur.data.user:null;}catch(e){}}
    if (user) {
      const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
      if (profile && (profile.is_admin || profile.role === 'admin')) {
        currentAdmin = profile;
        isLoggedIn = true;
        const ov = document.getElementById('loginOverlay');
        if (ov) ov.classList.remove('active');
        setTimeout(function(){
          if(window.PSPExecutiveDashboard181&&typeof window.loadDashboardStats==='function'){
            window.loadDashboardStats(true);
          }else{
            initCharts();
            loadDashboardStats();
          }
          window.dispatchEvent(new Event('psp-admin-auth-ready'));
        },100);
        return;
      }
    }
  } catch (e) {}
  const ov = document.getElementById('loginOverlay');
  if (ov) ov.classList.add('active');
});

async function loginAdmin() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  
  errorEl.style.display = 'none';
  
  if (!email || !password) {
    errorEl.textContent = '❌ Please enter email and password';
    errorEl.style.display = 'block';
    return;
  }
  
  btn.textContent = '⏳ Signing in...';
  btn.disabled = true;
  
  try {
    // Sign in with Supabase
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    
    if (error) {
      errorEl.textContent = '❌ ' + error.message;
      errorEl.style.display = 'block';
      btn.textContent = '🔐 Sign In to Admin';
      btn.disabled = false;
      return;
    }
    
    // Check if user is admin
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
    
    if (!profile || !(profile.is_admin === true || profile.role === 'admin')) {
      // Not an admin — sign out and reject
      await sb.auth.signOut();
      errorEl.textContent = '❌ You do not have admin access. Only authorized admins can login here.';
      errorEl.style.display = 'block';
      btn.textContent = '🔐 Sign In to Admin';
      btn.disabled = false;
      return;
    }
    
    // Success! Admin verified
    currentAdmin = profile;
    document.getElementById('loginOverlay').classList.remove('active');
    isLoggedIn = true;
    setTimeout(function(){
      if(window.PSPExecutiveDashboard181&&typeof window.loadDashboardStats==='function'){
        window.loadDashboardStats(true);
      }else{
        initCharts();
        loadDashboardStats();
      }
      window.dispatchEvent(new Event('psp-admin-auth-ready'));
    },100);
    
  } catch (e) {
    errorEl.textContent = '❌ Network error: ' + e.message;
    errorEl.style.display = 'block';
    btn.textContent = '🔐 Sign In to Admin';
    btn.disabled = false;
  }
}

async function logoutAdmin() {
  if (!(await window.pspConfirm('Are you sure you want to logout?'))) return;
  await sb.auth.signOut();
  currentAdmin = null;
  isLoggedIn = false;
  window.dispatchEvent(new Event('psp-admin-auth-closed'));
  document.getElementById('loginOverlay').classList.add('active');
  document.getElementById('adminEmail').value = '';
  document.getElementById('adminPassword').value = '';
}

async function uploadCourseThumb(input){
  const file=input.files&&input.files[0];if(!file)return;
  const prev=document.getElementById('courseThumbPrev');
  if(prev)prev.innerHTML='<span style="font-size:12px;color:#94a0b8">Checking 16:9 thumbnail...</span>';
  try{
    if(!/^image\//i.test(file.type||''))throw new Error('Please select an image file.');
    if(file.size>8*1024*1024)throw new Error('Thumbnail must be smaller than 8 MB.');
    const dims=await new Promise((resolve,reject)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{resolve({width:img.naturalWidth,height:img.naturalHeight});URL.revokeObjectURL(url)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read the selected image.'))};img.src=url;});
    const ratio=dims.width/dims.height;
    if(!Number.isFinite(ratio)||Math.abs(ratio-(16/9))>0.025)throw new Error('Use a 16:9 thumbnail. Recommended size: 1280 × 720 px.');
    if(prev)prev.innerHTML='<span style="font-size:12px;color:#94a0b8">Uploading '+dims.width+' × '+dims.height+'...</span>';
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
    const path='courses/'+Date.now()+'_'+Math.random().toString(36).slice(2,8)+'.'+ext;
    const {error}=await sb.storage.from('charts').upload(path,file,{upsert:true});
    if(error)throw error;
    const url=sb.storage.from('charts').getPublicUrl(path).data.publicUrl;
    document.getElementById('courseThumbnail').value=url;
    if(prev)prev.innerHTML='<div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap"><img src="'+url+'" style="width:240px;aspect-ratio:16/9;object-fit:contain;background:#0b1426;border-radius:10px;border:1px solid var(--border)"><div><div style="font-size:11px;font-weight:800;color:var(--green)">✓ Thumbnail uploaded</div><div style="font-size:10px;color:var(--text-muted);margin-top:4px">'+dims.width+' × '+dims.height+' · 16:9</div><button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="removeCourseThumbnail()">Remove</button></div></div>';
  }catch(e){input.value='';if(prev)prev.innerHTML='<span style="font-size:12px;color:#ef4444">'+String(e.message||e)+'</span>';}
}
function removeCourseThumbnail(){const hidden=document.getElementById('courseThumbnail'),file=document.getElementById('courseThumbFile'),prev=document.getElementById('courseThumbPrev');if(hidden)hidden.value='';if(file)file.value='';if(prev)prev.innerHTML='<span style="font-size:11px;color:var(--text-muted)">Thumbnail removed. Save the course to apply.</span>';}
function toggleQuickAdd(e){if(e)e.stopPropagation();const m=document.getElementById('qaMenu');if(m)m.style.display=m.style.display==='none'?'block':'none';}
function qaGo(page){
  const m=document.getElementById('qaMenu');if(m)m.style.display='none';
  if(page==='users'&&typeof openV28AddUser==='function'){openV28AddUser();return;}
  const nav=document.querySelector('[data-page="'+page+'"]');if(nav)nav.click();else showPage(page);
  setTimeout(function(){
    if(page==='courses'&&typeof openCourseForm==='function')openCourseForm();
    else if(page==='news'&&typeof openNewsForm==='function')openNewsForm();
    else if(page==='quiz'&&typeof openQuizForm==='function')openQuizForm();
  },60);
}
document.addEventListener('click',function(e){const m=document.getElementById('qaMenu');if(m&&m.style.display==='block'&&!e.target.closest('#qaWrap'))m.style.display='none';});
function aEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
var APMS='padding:10px;border-radius:8px;background:var(--input-bg,#0d1322);border:1px solid var(--border,#1f2937);color:var(--text,#e8eaf0);width:100%';
async function loadAdminPayments(){
  const wrap=document.getElementById('apmWrap');if(!wrap)return;
  wrap.innerHTML=`
    <section class="pm183-shell">
      <div class="pm183-hero">
        <div class="pm183-hero-copy">
          <span class="pm183-eyebrow">PAYMENT CONTROL CENTER</span>
          <h2><span class="pm183-hero-icon">💳</span> Payment Methods</h2>
          <p>Manage secure checkout options from one clean workspace. System methods stay protected while manual methods remain fully manageable.</p>
        </div>
        <div class="pm183-hero-actions">
          <span class="pm183-secure-chip">🛡️ Secure setup</span>
          <button type="button" class="pm183-refresh-btn" onclick="loadAdminPayments()">↻ Refresh</button>
        </div>
      </div>

      <div class="pm183-kpis">
        <div class="pm183-kpi"><span class="pm183-kpi-icon green">✓</span><div><small>Active Methods</small><strong id="pm183Active">—</strong><span>Available to users</span></div></div>
        <div class="pm183-kpi"><span class="pm183-kpi-icon orange">🔒</span><div><small>System Managed</small><strong id="pm183System">—</strong><span>API protected</span></div></div>
        <div class="pm183-kpi"><span class="pm183-kpi-icon blue">✦</span><div><small>Manual Methods</small><strong id="pm183Manual">—</strong><span>Managed by admin</span></div></div>
        <div class="pm183-kpi"><span class="pm183-kpi-icon purple">⚡</span><div><small>Checkout Status</small><strong>Ready</strong><span>Payment setup online</span></div></div>
      </div>

      <div class="pm183-main-grid">
        <section class="pm183-panel pm183-builder">
          <div class="pm183-panel-head">
            <div class="pm183-title-wrap"><span class="pm183-title-icon">＋</span><div><h3>Add Manual Payment Method</h3><p>Create EasyPaisa, JazzCash, bank or crypto payment options.</p></div></div>
            <span class="pm183-pill manual">MANUAL</span>
          </div>

          <div class="pm183-note"><span>ℹ</span><div><b>Local Bank Transfer is API managed.</b><br>Use this form only for manual payment methods. System methods cannot be edited or deleted.</div></div>

          <div class="pm183-form-grid">
            <label class="pm183-field pm183-field-full"><span>Payment Type</span>
              <select id="apmType" onchange="apmTypeChange()"><option value="easypaisa">EasyPaisa</option><option value="jazzcash">JazzCash</option><option value="bank">Bank Transfer</option><option value="crypto">Crypto (USDT TRC20)</option></select>
            </label>
            <label class="pm183-field pm183-field-full"><span>Display Label <em>optional</em></span><input id="apmLabel" placeholder="e.g. Company EasyPaisa"></label>
            <label class="pm183-field"><span>Account Title</span><input id="apmTitle" class="apm-title" placeholder="Account holder name"></label>
            <label class="pm183-field"><span>Account Number</span><input id="apmNum" class="apm-num" placeholder="Enter account number"></label>
            <label class="pm183-field pm183-field-full apm-bank" style="display:none"><span>Bank Name</span><input id="apmBank" placeholder="Bank name"></label>
            <label class="pm183-field pm183-field-full apm-wallet" style="display:none"><span>Wallet Address</span><input id="apmWallet" placeholder="USDT TRC20 wallet address"></label>
            <label class="pm183-field pm183-field-full apm-net" style="display:none"><span>Network</span><input id="apmNet" placeholder="Network" value="TRC20"></label>
          </div>
          <button class="pm183-save-btn" onclick="addAdminPM()"><span>💾</span> Save Payment Method</button>
          <div class="pm183-form-foot"><span>🔐</span> Payment credentials are stored in your project database. Review account details before enabling a method.</div>
        </section>

        <section class="pm183-panel pm183-methods">
          <div class="pm183-panel-head">
            <div class="pm183-title-wrap"><span class="pm183-title-icon">▣</span><div><h3>Configured Methods</h3><p>See what users can currently choose at checkout.</p></div></div>
            <span class="pm183-pill live">LIVE</span>
          </div>
          <div class="pm183-legend"><span><i class="on"></i> Enabled</span><span><i class="system"></i> System managed</span><span><i class="manual"></i> Manual</span></div>
          <div id="apmList" class="pm183-list"><div class="pm183-loading"><span></span> Loading payment methods...</div></div>
        </section>
      </div>
    </section>`;
  apmTypeChange();loadAdminPMList();
}
function apmTypeChange(){var t=document.getElementById('apmType').value;var S=function(c,on){var e=document.querySelector(c);if(e)e.style.display=on?'block':'none';};S('.apm-bank',t==='bank');S('.apm-wallet',t==='crypto');S('.apm-net',t==='crypto');S('.apm-title',t!=='crypto');S('.apm-num',t!=='crypto');}
async function addAdminPM(){
  var t=document.getElementById('apmType').value;var v=function(id){return (document.getElementById(id).value||'').trim();};
  var defaultName={easypaisa:'EasyPaisa',jazzcash:'JazzCash',bank:'Bank Transfer',crypto:'USDT TRC20'}[t]||'Payment Method';
  var displayName=v('apmLabel')||defaultName;
  var obj={owner_id:currentAdmin.id,name:displayName,type:t,label:displayName,enabled:true,is_system:false,system_key:null};
  if(t==='crypto'){obj.wallet=v('apmWallet');obj.network=v('apmNet')||'TRC20';if(!obj.wallet){alert('Wallet address required');return;}}
  else{obj.account_title=v('apmTitle');obj.account_number=v('apmNum');if(!obj.account_number){alert('Account number required');return;}if(t==='bank')obj.bank_name=v('apmBank');}
  var r=await sb.from('payment_methods').insert(obj);
  if(r.error){alert('Payment method could not be saved: '+r.error.message);return;} alert('Payment method saved successfully.');
  ['apmLabel','apmTitle','apmNum','apmBank','apmWallet'].forEach(function(i){document.getElementById(i).value='';});loadAdminPMList();
}
async function loadAdminPMList(){
  var box=document.getElementById('apmList');if(!box)return;
  var r=await sb.from('payment_methods').select('*').order('created_at',{ascending:false});
  if(r.error){box.innerHTML='<div class="pm183-error">⚠ '+aEsc(r.error.message)+'</div>';return;}
  var data=(r.data||[]).filter(function(m){return m.is_system===true||m.owner_id===currentAdmin.id;});
  data.sort(function(a,b){return Number(b.is_system===true)-Number(a.is_system===true)||String(b.created_at||'').localeCompare(String(a.created_at||''));});
  var active=data.filter(function(m){return m.enabled!==false}).length;
  var systemCount=data.filter(function(m){return m.is_system===true||m.system_key==='infinity_local_bank'||m.type==='infinity'}).length;
  var manualCount=Math.max(0,data.length-systemCount);
  var setText=function(id,val){var e=document.getElementById(id);if(e)e.textContent=val;};
  setText('pm183Active',active);setText('pm183System',systemCount);setText('pm183Manual',manualCount);
  if(!data.length){box.innerHTML='<div class="pm183-empty"><span>💳</span><b>No payment methods yet</b><small>Add a manual method from the form.</small></div>';return;}
  var icons={easypaisa:'📱',jazzcash:'📲',bank:'🏦',crypto:'₮',infinity:'🏛️'};
  box.innerHTML=data.map(function(m){
    var system=m.is_system===true||m.system_key==='infinity_local_bank'||m.type==='infinity';
    var tl={easypaisa:'EasyPaisa',jazzcash:'JazzCash',bank:'Bank Transfer',crypto:'USDT TRC20',infinity:'Local Bank Transfer'}[m.type]||m.type||'Payment Method';
    var det=system?'Secure hosted bank transfer · API managed':(m.type==='crypto'?(aEsc(m.wallet||'')+' · '+aEsc(m.network||'TRC20')):(aEsc(m.account_title||'')+(m.account_number?(' · '+aEsc(m.account_number)):'')+(m.bank_name?(' · '+aEsc(m.bank_name)):'')));
    var enabled=m.enabled!==false;
    var status='<span class="pm183-status '+(enabled?'enabled':'disabled')+'"><i></i>'+(enabled?'Enabled':'Disabled')+'</span>';
    var badge=system?'<span class="pm183-method-badge system">SYSTEM · LOCKED</span>':'<span class="pm183-method-badge manual">MANUAL</span>';
    var actions=system?'<div class="pm183-system-lock">🔒 Managed automatically</div>':'<div class="pm183-actions"><button class="pm183-toggle '+(enabled?'disable':'enable')+'" onclick="toggleAdminPM(\''+m.id+'\','+(enabled?'false':'true')+')">'+(enabled?'Disable':'Enable')+'</button><button class="pm183-delete" title="Delete method" onclick="delAdminPM(\''+m.id+'\')">🗑</button></div>';
    var label=aEsc(m.label||tl);
    return '<article class="pm183-method-card '+(system?'is-system':'is-manual')+' '+(enabled?'is-enabled':'is-disabled')+'"><div class="pm183-method-icon">'+(icons[m.type]||'💳')+'</div><div class="pm183-method-content"><div class="pm183-method-top"><div><h4>'+label+'</h4><div class="pm183-method-tags">'+status+badge+'</div></div>'+actions+'</div><div class="pm183-method-detail"><b>'+aEsc(tl)+'</b><span>'+det+'</span></div></div></article>';
  }).join('');
}
async function toggleAdminPM(id,on){
  var r=await sb.from('payment_methods').update({enabled:on}).eq('id',id).eq('is_system',false);
  if(r.error){alert('System-managed payment methods cannot be changed.');return;}loadAdminPMList();
}
async function delAdminPM(id){
  if(!(await window.pspConfirm('Delete this payment method?')))return;
  var r=await sb.from('payment_methods').delete().eq('id',id).eq('is_system',false);
  if(r.error){alert('System-managed payment methods cannot be deleted.');return;}loadAdminPMList();
}

async function loadAdminPaymentReqs(){
  var wrap=document.getElementById('aprWrap');if(!wrap)return;
  wrap.innerHTML='<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><h3 style="margin:0">🧾 Payment Requests</h3><select id="aprFilter" onchange="loadAprList()" style="'+APMS+';max-width:160px"><option value="pending">Pending</option><option value="all">All</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div><div id="aprList" style="margin-top:14px">Loading...</div></div>';
  loadAprList();
}
async function loadAprList(){
  var box=document.getElementById('aprList');if(!box)return;
  var f=document.getElementById('aprFilter')?document.getElementById('aprFilter').value:'pending';
  var q=sb.from('payment_requests').select('*, profiles:user_id(full_name,email), mentor:mentor_id(full_name)').order('created_at',{ascending:false});
  if(f!=='all')q=q.eq('status',f);
  var r=await q;
  if(r.error){box.innerHTML='<div style="color:#ef4444">'+aEsc(r.error.message)+'</div>';return;}
  var data=r.data||[];if(!data.length){box.innerHTML='<div style="color:#94a0b8">No requests.</div>';return;}
  box.innerHTML=data.map(function(x){
    var u=x.profiles||{};var mn=x.mentor?x.mentor.full_name:'-';
    var col=x.status==='approved'?'#10b981':(x.status==='rejected'?'#ef4444':'#f59e0b');
    var rc=x.receipt_url?'<a href="'+aEsc(x.receipt_url)+'" target="_blank"><img src="'+aEsc(x.receipt_url)+'" style="width:74px;height:74px;object-fit:cover;border-radius:8px;border:1px solid var(--border,#1f2937)"></a>':'<span style="color:#94a0b8;font-size:12px">No receipt</span>';
    var act=x.status==='pending'
      ?'<div style="display:flex;gap:8px;margin-top:10px"><button onclick="aprApprove(\''+x.id+'\')" style="padding:7px 14px;border:none;border-radius:8px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:700;cursor:pointer">✅ Approve</button><button onclick="aprReject(\''+x.id+'\')" style="padding:7px 14px;border:none;border-radius:8px;background:rgba(239,68,68,.15);color:#ef4444;cursor:pointer">❌ Reject</button></div>'
      :(x.status==='approved'?'<div style="display:flex;gap:8px;margin-top:10px"><button onclick="aprReject(\''+x.id+'\')" style="padding:7px 14px;border:none;border-radius:8px;background:rgba(239,68,68,.15);color:#ef4444;cursor:pointer">↩️ Reject / Revoke access</button></div>':'<div style="display:flex;gap:8px;margin-top:10px"><button onclick="aprApprove(\''+x.id+'\')" style="padding:7px 14px;border:none;border-radius:8px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:700;cursor:pointer">✅ Approve anyway</button></div>');
    var isIb=x.request_type==='ib';
    var typeBadge=isIb?'<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:rgba(16,185,129,.18);color:#10b981;margin-left:6px">🤝 IB</span>':'';
    var line=isIb
      ?('🤝 '+aEsc(x.plan_name||'Plan')+' · Acc: <strong>'+aEsc(x.trading_account||'-')+'</strong>'+(x.amount?(' · deposit '+x.amount+' '+aEsc(x.currency||'')):''))
      :('💎 '+aEsc(x.plan_name||'Plan')+' · <strong>'+(x.amount||0)+' '+aEsc(x.currency||'')+'</strong> · '+aEsc(x.method_type||''));
    return '<div style="display:flex;gap:12px;padding:12px;border:1px solid var(--border,#1f2937);border-radius:12px;margin-bottom:10px"><div>'+rc+'</div><div style="flex:1"><div style="display:flex;justify-content:space-between;gap:8px"><strong>'+aEsc(u.full_name||u.email||'Student')+typeBadge+'</strong><span style="color:'+col+';font-weight:800;font-size:12px;text-transform:uppercase">'+aEsc(x.status)+'</span></div><div style="font-size:12px;color:#94a0b8">'+aEsc(u.email||'')+' · Mentor: '+aEsc(mn)+'</div><div style="font-size:13px;margin-top:7px">'+line+'</div>'+(x.txn_id?'<div style="font-size:12px;color:#94a0b8">Txn: '+aEsc(x.txn_id)+'</div>':'')+(x.notes?'<div style="font-size:12px;color:#94a0b8">Note: '+aEsc(x.notes)+'</div>':'')+'<div style="font-size:11px;color:#94a0b8;margin-top:4px">'+new Date(x.created_at).toLocaleString()+'</div>'+act+'</div></div>';
  }).join('');
}
async function aprApprove(id){if(!(await window.pspConfirm('Approve & activate VIP for this student?')))return;var r=await sb.rpc('approve_payment_v2',{req_id:id});if(r.error){alert('Error: '+r.error.message);return;}loadAprList();}
async function aprReject(id){if(!(await window.pspConfirm('Reject this request? If it was approved, the student\'s premium access will be revoked.')))return;var r=await sb.rpc('reject_payment_v2',{req_id:id});if(r.error){alert('Error: '+r.error.message);return;}loadAprList();}

// ============ OFFICIAL PLAN BUILDER (admin) ============
var ASVC={signal:'📶 Signal',chart:'📈 Chart',courses:'🎓 Courses',vipindicator:'📐 VIP Indicator',vipea:'🤖 VIP EA'};
function asSvcChips(arr){return (arr||[]).map(function(s){return '<span style="display:inline-block;font-size:10.5px;padding:2px 8px;border-radius:20px;background:rgba(245,158,11,.15);color:#f59e0b;font-weight:700;margin:2px 3px 0 0">'+(ASVC[s]||s)+'</span>';}).join('');}
function loadAdminSubs(){
  var wrap=document.getElementById('adminSubsWrap');if(!wrap)return;
  wrap.innerHTML='<div style="display:grid;grid-template-columns:1fr 1.1fr;gap:18px">'+
    '<div class="card"><h3 style="margin:0 0 4px">✨ Create Official Plan</h3><div class="card-meta" style="margin-bottom:12px">Shown to ALL students (every mentor). Official platform package.</div><div style="display:grid;gap:11px">'+
      '<div style="display:flex;gap:10px"><input id="op-icon" maxlength="2" value="💎" style="'+APMS+';max-width:60px;text-align:center;font-size:18px" oninput="opPreview()"><input id="op-name" placeholder="Plan name e.g. PipSePaisa VIP" style="'+APMS+'" oninput="opPreview()"></div>'+
      '<input id="op-tag" placeholder="Short tagline (optional)" style="'+APMS+'" oninput="opPreview()">'+
      '<div style="display:flex;gap:10px"><input id="op-price" type="number" placeholder="Price" style="'+APMS+'" oninput="opPreview()"><select id="op-cur" style="'+APMS+';max-width:90px" onchange="opPreview()"><option>PKR</option><option>USD</option></select><select id="op-period" style="'+APMS+';max-width:130px" onchange="opPreview()"><option value="monthly">per month</option><option value="yearly">per year</option><option value="lifetime">Lifetime</option></select></div>'+
      '<textarea id="op-feat" rows="3" placeholder="Features (one per line)" style="'+APMS+'" oninput="opPreview()"></textarea>'+
      '<div><div style="font-size:12px;font-weight:700;color:var(--text-secondary,#94a0b8);margin-bottom:7px">📦 Services included</div><div style="display:flex;flex-wrap:wrap;gap:8px">'+
        ['signal','chart','courses','vipindicator','vipea'].map(function(v){return '<label class="tick-chip"><input type="checkbox" class="op-svc" value="'+v+'" onchange="opPreview()"> '+ASVC[v]+(v==='vipindicator'||v==='vipea'?' <span style="font-size:10px;color:#94a0b8">(soon)</span>':'')+'</label>';}).join('')+
      '</div></div>'+
      '<select id="op-mtype" style="'+APMS+'" onchange="opPreview()"><option value="premium">💎 Member type: Premium</option><option value="vip">👑 Member type: VIP</option></select>'+
      '<div style="display:flex;gap:18px;flex-wrap:wrap"><label style="display:flex;gap:7px;align-items:center;font-size:13px;cursor:pointer"><input type="checkbox" id="op-pop" onchange="opPreview()"> ⭐ Popular</label><label style="display:flex;gap:7px;align-items:center;font-size:13px;cursor:pointer"><input type="checkbox" id="op-vip" onchange="opPreview()"> 👑 VIP gold</label></div>'+
      '<label style="display:flex;gap:7px;align-items:center;font-size:13px;cursor:pointer;border-top:1px solid var(--border,#1f2937);padding-top:11px"><input type="checkbox" id="op-ibon" onchange="opIbToggle();opPreview()"> 🤝 Also offer via IB (discounted/free)</label>'+
      '<div id="op-ibfields" style="display:none;gap:11px">'+
        '<input id="op-iblink" placeholder="Broker registration / IB link" style="'+APMS+'" oninput="opPreview()">'+
        '<div style="display:flex;gap:10px"><input id="op-ibbroker" placeholder="Broker name" style="'+APMS+'" oninput="opPreview()"><input id="op-ibdep" type="number" placeholder="Min deposit" style="'+APMS+';max-width:120px" oninput="opPreview()"></div>'+
        '<input id="op-ibprice" type="number" value="0" placeholder="IB members fee (0=free)" style="'+APMS+'" oninput="opPreview()">'+
      '</div>'+
      '<button onclick="createOfficialPlan()" style="padding:11px;border:none;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e1a;font-weight:800;cursor:pointer">✨ Create Official Plan</button>'+
    '</div></div>'+
    '<div class="card"><h3 style="margin:0 0 12px">👁️ Preview</h3><div id="opPreview"></div><h3 style="margin:18px 0 10px">💎 Official Plans</h3><div id="opList">Loading...</div></div>'+
  '</div>';
  opIbToggle();opPreview();loadOfficialPlans();
}
function opIbToggle(){var f=document.getElementById('op-ibfields');var on=(document.getElementById('op-ibon')||{}).checked;if(f)f.style.display=on?'grid':'none';}
function opGetSvc(){return Array.prototype.slice.call(document.querySelectorAll('.op-svc:checked')).map(function(c){return c.value;});}
function opVal(id){var e=document.getElementById(id);return e?(e.value||'').trim():'';}
function opCardHTML(p){
  var perLbl=p.period==='lifetime'?'one-time':(p.period==='yearly'?'/yr':'/mo');
  var feats=((p.features&&p.features.length)?p.features:['Premium access']).map(function(x){return '<li style="padding:3px 0;font-size:12.5px">✓ '+aEsc(x)+'</li>';}).join('');
  var chips=(p.services&&p.services.length)?'<div style="margin:4px 0 6px;line-height:1.9">'+asSvcChips(p.services)+'</div>':'';
  var mt='<span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:800;'+(p.member_type==='vip'?'background:#f59e0b;color:#0a0e1a':'background:rgba(139,92,246,.2);color:#a78bfa')+'">'+(p.member_type==='vip'?'👑 VIP':'💎 PREMIUM')+'</span>';
  var ib=p.ib?'<div style="margin-top:6px;padding:6px 9px;border-radius:8px;background:rgba(16,185,129,.12);font-size:12px;color:#10b981;font-weight:800">🤝 IB: '+(p.ibprice>0?(p.ibprice+' '+aEsc(p.currency||'')):'FREE')+'</div>':'';
  return '<div style="border:1px solid var(--border,#1f2937);border-radius:14px;padding:16px;background:linear-gradient(160deg,rgba(245,158,11,.06),transparent)">'+
    '<div style="font-size:28px">'+aEsc(p.icon||'💎')+'</div><div style="font-weight:800;font-size:16px;margin-top:4px">'+aEsc(p.name||'Plan')+'</div>'+
    (p.tagline?'<div style="font-size:12px;color:#94a0b8">'+aEsc(p.tagline)+'</div>':'')+'<div style="margin-top:6px">'+mt+'</div>'+chips+
    '<div style="font-size:24px;font-weight:800;color:#f59e0b;margin:8px 0">'+(p.price||0)+'<span style="font-size:12px;color:#94a0b8;font-weight:600"> '+aEsc(p.currency||'')+' '+perLbl+'</span></div>'+ib+
    '<ul style="list-style:none;padding:0;margin:8px 0 0">'+feats+'</ul>'+(p.id?'<button onclick="delOfficialPlan(\''+p.id+'\')" style="margin-top:10px;padding:5px 12px;border-radius:8px;background:rgba(239,68,68,.15);border:none;color:#ef4444;cursor:pointer;font-size:12px">🗑️ Remove</button>':'')+'</div>';
}
function opPreview(){
  var box=document.getElementById('opPreview');if(!box)return;
  var p={icon:opVal('op-icon')||'💎',name:opVal('op-name')||'Plan name',tagline:opVal('op-tag'),price:parseFloat(opVal('op-price'))||0,currency:opVal('op-cur'),period:(document.getElementById('op-period')||{}).value,features:opVal('op-feat').split('\n').map(function(x){return x.trim();}).filter(Boolean),services:opGetSvc(),member_type:(document.getElementById('op-mtype')||{}).value||'premium',ib:(document.getElementById('op-ibon')||{}).checked,ibprice:parseFloat(opVal('op-ibprice'))||0};
  box.innerHTML=opCardHTML(p);
}
async function createOfficialPlan(){
  var name=opVal('op-name');if(!name){alert('Plan name required');return;}
  var period=(document.getElementById('op-period')||{}).value;var dur=period==='lifetime'?36500:(period==='yearly'?365:30);
  var services=opGetSvc();var ibon=(document.getElementById('op-ibon')||{}).checked;
  var f='[ICON]'+(opVal('op-icon')||'💎')+'\n';
  if(document.getElementById('op-pop').checked)f+='[POPULAR]\n';
  if(document.getElementById('op-vip').checked)f+='[VIP]\n';
  if(services.length)f+='[SERVICES]'+services.join(',')+'\n';
  if(ibon){f+='[IB]\n';var lk=opVal('op-iblink');if(lk)f+='[IBLINK]'+lk+'\n';var br=opVal('op-ibbroker');if(br)f+='[IBBROKER]'+br+'\n';var dp=parseFloat(opVal('op-ibdep'))||0;if(dp)f+='[IBDEPOSIT]'+dp+'\n';f+='[IBPRICE]'+(parseFloat(opVal('op-ibprice'))||0)+'\n';}
  f+='[PERIOD]'+period+'\n';var tag=opVal('op-tag');if(tag)f+='[TAG]'+tag+'\n';f+=opVal('op-feat');
  var obj={owner_id:currentAdmin.id,is_official:true,name:name,price:parseFloat(opVal('op-price'))||0,currency:opVal('op-cur'),duration_days:dur,features:f,is_active:true,services:(services.length?services.join(','):null),member_type:(document.getElementById('op-mtype')||{}).value||'premium'};
  var r=await sb.from('subscription_plans').insert(obj);
  if(r.error){alert('Error: '+r.error.message);return;}
  ['op-name','op-price','op-feat','op-tag','op-iblink','op-ibbroker','op-ibdep'].forEach(function(i){var e=document.getElementById(i);if(e)e.value='';});
  document.getElementById('op-icon').value='💎';document.getElementById('op-pop').checked=false;document.getElementById('op-vip').checked=false;document.getElementById('op-ibon').checked=false;document.getElementById('op-ibprice').value='0';document.getElementById('op-mtype').value='premium';
  document.querySelectorAll('.op-svc').forEach(function(c){c.checked=false;});opIbToggle();opPreview();loadOfficialPlans();
}
async function loadOfficialPlans(){
  var box=document.getElementById('opList');if(!box)return;
  var r=await sb.from('subscription_plans').select('*').eq('is_official',true).order('price',{ascending:true});
  if(r.error){box.innerHTML='<div style="color:#ef4444">'+aEsc(r.error.message)+'</div>';return;}
  var data=r.data||[];if(!data.length){box.innerHTML='<div style="color:#94a0b8">No official plans yet.</div>';return;}
  box.innerHTML='<div style="display:grid;gap:12px">'+data.map(function(row){return opCardHTML(opParse(row));}).join('')+'</div>';
}
function opParse(row){
  var lines=(row.features||'').split('\n');var icon='💎',tag='',pop=false,vip=false,period='monthly',feats=[],ib=false,ibprice=0,services=[];
  lines.forEach(function(l){var t=l.trim();if(!t)return;
    if(t==='[POPULAR]')pop=true;else if(t==='[VIP]')vip=true;else if(t==='[IB]')ib=true;
    else if(t.indexOf('[SERVICES]')===0)services=t.slice(10).split(',').map(function(x){return x.trim();}).filter(Boolean);
    else if(t.indexOf('[IBPRICE]')===0)ibprice=parseFloat(t.slice(9))||0;
    else if(t.indexOf('[ICON]')===0)icon=t.slice(6).trim()||'💎';
    else if(t.indexOf('[TAG]')===0)tag=t.slice(5).trim();
    else if(t.indexOf('[PERIOD]')===0)period=t.slice(8).trim()||'monthly';
    else if(t.indexOf('[IBLINK]')===0||t.indexOf('[IBBROKER]')===0||t.indexOf('[IBDEPOSIT]')===0){}
    else feats.push(t);});
  if(row.services)services=row.services.split(',').map(function(x){return x.trim();}).filter(Boolean);
  return {id:row.id,name:row.name,price:row.price,currency:row.currency,icon:icon,tagline:tag,popular:pop,vip:vip,period:period,features:feats,ib:ib,ibprice:ibprice,services:services,member_type:row.member_type||'premium'};
}
async function delOfficialPlan(id){if(!(await window.pspConfirm('Delete this official plan?')))return;await sb.from('subscription_plans').delete().eq('id',id);loadOfficialPlans();}

// ============ OFFICIAL SIGNALS & CHARTS (admin) ============
var ADPAIRS=['XAU/USD','XAG/USD','EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','USD/CAD','NZD/USD','EUR/JPY','GBP/JPY','BTC/USD','ETH/USD'];
function adPairOpts(){return ADPAIRS.map(function(p){return '<option value="'+p+'">'+p+'</option>';}).join('');}

const SIGNAL_NOTE_TEMPLATES = [
"Wait for candle confirmation before entering the trade.",
"Enter only in the given entry zone, don't chase.",
"Do not chase the market if the entry zone is missed.",
"Risk only 1–2% of your account on a single trade.",
"Use minimum lot size.",
"Move your Stop Loss to Breakeven after TP1 is hit.",
"Book partial profits at TP1 whenever possible.",
"Hold till TP3 if momentum is strong.",
"Best entry during London/NY session.",
"Avoid high-impact news unless the setup is planned.",
"No trade is better than a bad trade.",
"Trade responsibly and stay disciplined."
];
function adSignalNoteOptions(){return '<option value="">Select mentor note template (optional)</option>'+SIGNAL_NOTE_TEMPLATES.map(function(n,i){var label=n.replace(/^[•📌⚠️\s]+/,'').slice(0,70);return '<option value="'+aEsc(n)+'">'+aEsc(label)+'</option>';}).join('');}
function applyAdSignalNote(selId,targetId){var s=document.getElementById(selId),t=document.getElementById(targetId);if(!s||!t||!s.value)return; t.value = t.value.trim() ? (t.value.trim()+"\n\n"+s.value) : s.value; s.value=''; t.focus();}

var adSigDir='buy';
function adAudTicks(cls){return '<div style="display:flex;flex-wrap:wrap;gap:8px"><label class="tick-chip"><input type="checkbox" class="'+cls+'" value="free" checked> 🆓 Free</label><label class="tick-chip"><input type="checkbox" class="'+cls+'" value="premium"> 💎 Premium</label><label class="tick-chip"><input type="checkbox" class="'+cls+'" value="vip"> 👑 VIP</label></div>';}
function loadAdSignals(){
  var wrap=document.getElementById('adSigWrap');if(!wrap)return;
  wrap.innerHTML='<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:18px">'+
    '<div class="card"><h3 style="margin:0 0 12px">📊 New Official Signal</h3><div style="display:grid;gap:11px">'+
      '<select id="as-pair" style="'+APMS+'">'+adPairOpts()+'</select>'+
      '<div style="display:flex;gap:8px"><button type="button" id="as-buy" onclick="adSigSetDir(\'buy\')" style="flex:1;padding:9px;border-radius:8px;border:1px solid var(--border,#1f2937);background:rgba(16,185,129,.18);color:#10b981;font-weight:800;cursor:pointer">▲ BUY</button><button type="button" id="as-sell" onclick="adSigSetDir(\'sell\')" style="flex:1;padding:9px;border-radius:8px;border:1px solid var(--border,#1f2937);background:transparent;color:#94a0b8;font-weight:800;cursor:pointer">▼ SELL</button></div>'+
      '<select id="as-ordertype" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid var(--border,#1f2937);background:rgba(0,0,0,.18);color:inherit;font-size:13px;margin-bottom:8px"><option value="market">⚡ Market Execution (Buy/Sell)</option><option value="buy_limit">📍 Buy Limit</option><option value="sell_limit">📍 Sell Limit</option><option value="buy_stop">🚀 Buy Stop</option><option value="sell_stop">🚀 Sell Stop</option></select>'+
      '<input id="as-entry" type="number" step="any" placeholder="Entry price" style="'+APMS+'">'+
      '<input id="as-sl" type="number" step="any" placeholder="Stop Loss" style="'+APMS+'">'+
      '<input id="as-tp1" type="number" step="any" placeholder="Take Profit 1" style="'+APMS+'">'+
      '<input id="as-tp2" type="number" step="any" placeholder="Take Profit 2 (optional)" style="'+APMS+'">'+
      '<input id="as-tp3" type="number" step="any" placeholder="Take Profit 3 (optional)" style="'+APMS+'">'+
      '<input id="as-tp4" type="text" placeholder="TP4 / Runner (optional — number ya \'Open\')" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid var(--border,#1f2937);background:rgba(0,0,0,.18);color:inherit;font-size:13px;margin-bottom:8px">'+
      '<select id="as-note-tpl" onchange="applyAdSignalNote(\'as-note-tpl\',\'as-notes\')" style="'+APMS+'">'+adSignalNoteOptions()+'</select>'+
      '<textarea id="as-notes" rows="5" placeholder="Notes (optional) — select template or type custom note" style="'+APMS+';resize:vertical"></textarea>'+
      ''+
      '<input id="as-plan" placeholder="VIP package name (optional)" style="'+APMS+'">'+
      '<button onclick="createAdSignal()" style="padding:11px;border:none;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e1a;font-weight:800;cursor:pointer">🚀 Publish Official Signal</button>'+
    '</div></div>'+
    '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px"><h3 style="margin:0">📋 Official Signals</h3><div style="display:flex;gap:6px"><button id="aSigTabA" onclick="aSigSetView(\'active\')" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border,#1f2937);background:#f59e0b;color:#0a0e1a;font-weight:800;font-size:12px;cursor:pointer">⚡ Active</button><button id="aSigTabH" onclick="aSigSetView(\'history\')" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border,#1f2937);background:transparent;color:inherit;font-weight:800;font-size:12px;cursor:pointer">📜 History</button></div></div><div id="asList">Loading...</div></div></div>';
  adSigSetDir('buy');loadAdSigList();
}
function adSigSetDir(d){adSigDir=d;var b=document.getElementById('as-buy'),s=document.getElementById('as-sell');if(b)b.style.cssText='flex:1;padding:9px;border-radius:8px;border:1px solid var(--border,#1f2937);'+(d==='buy'?'background:rgba(16,185,129,.18);color:#10b981':'background:transparent;color:#94a0b8')+';font-weight:800;cursor:pointer';if(s)s.style.cssText='flex:1;padding:9px;border-radius:8px;border:1px solid var(--border,#1f2937);'+(d==='sell'?'background:rgba(239,68,68,.18);color:#ef4444':'background:transparent;color:#94a0b8')+';font-weight:800;cursor:pointer';}
async function createAdSignal(){
  var v=function(id){var e=document.getElementById(id);return e?(e.value||'').trim():'';};
  var aud=['free','premium','vip'];
  var entry=parseFloat(v('as-entry'));
  var slv=parseFloat(v('as-sl'));
  var tp1v=parseFloat(v('as-tp1'));
  if(isNaN(entry)||isNaN(slv)||isNaN(tp1v)){alert('⚠️ Entry price, Stop Loss aur TP1 dena LAZMI hai — inke baghair signal publish nahi hoga.');return;}
  var _otv=((document.getElementById('as-ordertype')||{}).value)||'market';
  var _dirO=(_otv!=='market')?_otv.split('_')[0]:adSigDir;
  var _otype=(_otv!=='market')?_otv.split('_')[1]:'market';
  var obj={owner_id:currentAdmin.id,is_official:true,pair:(window.PSPPairsV216?.value('as-pair')||document.getElementById('as-pair').value),direction:_dirO.toUpperCase(),
    entry_price:isNaN(entry)?null:entry,stop_loss:parseFloat(v('as-sl'))||null,take_profit1:parseFloat(v('as-tp1'))||null,take_profit2:parseFloat(v('as-tp2'))||null,take_profit3:parseFloat(v('as-tp3'))||null,take_profit4:(v('as-tp4')||'').trim()||null,
    notes:v('as-notes')||null,audience:aud.join(','),access_level:aud.indexOf('free')>=0?'free':'vip',
    plan_name:(!(aud.length===1&&aud[0]==='free'))?(v('as-plan')||null):null,status:_otype!=='market'?'pending':'active',tp_hit:0,order_type:_otype,auto_monitor:false,activated_at:_otype==='market'?new Date().toISOString():null};
  var r=await sb.from('signals').insert(obj).select('*').single();
  if(r.error){alert('Error: '+r.error.message);return;}
  try{if(r.data&&window.PSP154Signals?.reminder)setTimeout(function(){window.PSP154Signals.reminder(r.data)},80)}catch(e){}
  await pspCreateNotificationAndPush('📊 New Signal Published', obj.pair+' '+obj.direction+' signal is now available.', 'signal', '/?tab=signals', obj.audience||'all');
  ['as-entry','as-sl','as-tp1','as-tp2','as-tp3','as-notes','as-plan'].forEach(function(i){var e=document.getElementById(i);if(e)e.value='';});
  loadAdSigList();
}
var aSigView='active';
function aSigSetView(v){aSigView=v;var A=document.getElementById('aSigTabA'),H=document.getElementById('aSigTabH');
  if(A&&H){A.style.background=(v==='active')?'#f59e0b':'transparent';A.style.color=(v==='active')?'#0a0e1a':'inherit';H.style.background=(v==='history')?'#f59e0b':'transparent';H.style.color=(v==='history')?'#0a0e1a':'inherit';}
  loadAdSigList();}
async function loadAdSigList(){
  var box=document.getElementById('asList');if(!box)return;
  var r=await sb.from('signals').select('*').eq('is_official',true).order('created_at',{ascending:false}).limit(60);
  if(r.error){box.innerHTML='<div style="color:#ef4444">'+aEsc(r.error.message)+'</div>';return;}
  var data=(r.data||[]).filter(function(s){var st=(s.status||'active');var fin=(st==='sl'||st==='sl_hit'||st==='closed'||st==='tp3'||st==='be');return (aSigView==='active')?(!fin):fin;});
  if(!data.length){box.innerHTML='<div style="color:#94a0b8">'+(aSigView==='active'?'No active signals right now. Check History for past results.':'No closed signals yet.')+'</div>';return;}
  box.innerHTML=data.map(function(s){
    var buy=(s.direction||'').toUpperCase()!=='SELL';var aud=(s.audience||(s.access_level==='vip'?'premium,vip':'free'));
    var parts=aud.split(',').map(function(x){return x.trim();}).filter(Boolean);var lbl={free:'🆓',premium:'💎',vip:'👑'};
    var ab=parts.map(function(p){return '<span style="font-size:9px;padding:1px 6px;border-radius:10px;background:'+(p==='free'?'rgba(16,185,129,.18);color:#10b981':'rgba(245,158,11,.18);color:#f59e0b')+'">'+(lbl[p]||p)+'</span>';}).join(' ');
    var st=(s.status||'active');var stMap={active:['● Active','#10b981'],tp1:['✅ TP1 Hit','#10b981'],tp2:['✅ TP2 Hit','#10b981'],tp3:['🏆 TP3 Hit','#10b981'],sl:['🛑 SL Hit','#ef4444'],be:['🔒 BE Hit','#8b5cf6'],closed:['🔒 Closed','#94a0b8']};
    var stInfo=stMap[st]||stMap.active;
    var pipsTxt=(s.result_pips!=null)?(' · <b style="color:'+(s.result_pips>=0?'#10b981':'#ef4444')+'">'+(s.result_pips>=0?'+':'')+s.result_pips+' pips</b>'):'';
    var btn=function(k,label,col){return '<button onclick="updateSigStatus(\''+s.id+'\',\''+k+'\')" style="padding:5px 9px;border-radius:7px;border:1px solid var(--border,#1f2937);background:'+col+';color:#fff;cursor:pointer;font-size:11px;font-weight:700">'+label+'</button>';};
    return '<div style="padding:11px 0;border-bottom:1px solid var(--border,#1f2937)"><div style="display:flex;justify-content:space-between;align-items:center"><div><strong>'+aEsc(s.pair)+'</strong> <span style="font-size:10px;padding:1px 7px;border-radius:10px;background:'+(buy?'rgba(16,185,129,.18);color:#10b981':'rgba(239,68,68,.18);color:#ef4444')+'">'+(buy?'BUY':'SELL')+'</span> '+ab+'</div><button onclick="delAdSig(\''+s.id+'\')" style="padding:4px 9px;border-radius:7px;background:rgba(239,68,68,.15);border:none;color:#ef4444;cursor:pointer">🗑️</button></div>'+
      '<div style="font-size:12px;color:#94a0b8;margin-top:3px">Entry '+(s.entry_price||'-')+' · SL '+(s.stop_loss||'-')+' · TP1 '+(s.take_profit1||'-')+' · TP2 '+(s.take_profit2||'-')+' · TP3 '+(s.take_profit3||'-')+'</div>'+
      '<div style="font-size:12px;margin-top:5px"><span style="color:'+stInfo[1]+';font-weight:700">'+stInfo[0]+'</span>'+pipsTxt+'</div>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:7px"><input id="pips-'+s.id+'" type="number" step="any" placeholder="pips" value="'+(s.result_pips!=null?s.result_pips:'')+'" style="width:80px;padding:5px 8px;border-radius:7px;border:1px solid var(--border,#1f2937);background:var(--bg-elevated,#1a2235);color:var(--text,#e8eaf0);font-size:12px">'+
      (s.be_moved?'<span style="font-size:10px;font-weight:800;padding:4px 9px;border-radius:999px;background:rgba(14,165,233,.15);color:#0ea5e9;border:1px solid rgba(14,165,233,.4)">🔒 SL @ BE</span>':'')+btn('tp1','TP1 Hit','#10b981')+btn('tp2','TP2 Hit','#10b981')+btn('tp3','TP3 Hit','#059669')+btn('be_move','SL → BE','#0ea5e9')+btn('be','BE Hit','#8b5cf6')+btn('sl','SL Hit','#ef4444')+btn('closed','Close','#64748b')+'</div></div>';
  }).join('');
}
async function updateSigStatus(id,kind){
  var pi=document.getElementById('pips-'+id);var pips=(pi&&pi.value!=='')?parseFloat(pi.value):null;var obj={auto_monitor:false};var effectiveKind=kind;
  var sgRow={};try{var rr=await sb.from('signals').select('be_moved,entry_price,result_pips,tp_hit,take_profit1,take_profit2,take_profit3,pair,direction').eq('id',id).maybeSingle();sgRow=rr.data||{};}catch(e){}
  var terminal=['tp3','be','sl','closed'].indexOf(kind)>-1;
  if(kind==='be_move'){obj={be_moved:true,be_moved_at:new Date().toISOString(),auto_monitor:false};}
  else if(kind==='tp1'||kind==='tp2'){obj={status:kind,tp_hit:kind==='tp1'?1:2,auto_monitor:false};if(pips!==null&&!isNaN(pips))obj.result_pips=pips;}
  else if(kind==='be'||(kind==='sl'&&sgRow.be_moved)){effectiveKind='be';obj={status:'be',closed_at:new Date().toISOString(),closing_price:sgRow.entry_price,result_pips:0,auto_monitor:false};}
  else{obj={status:kind,closed_at:new Date().toISOString(),auto_monitor:false};if(kind==='tp3')obj.tp_hit=3;if(pips!==null&&!isNaN(pips))obj.result_pips=pips;}
  var r=await sb.from('signals').update(obj).eq('id',id);if(r.error){alert('Error: '+r.error.message);return;}
  if(terminal){try{await pspCreateNotificationAndPush('🔒 Signal Closed',effectiveKind==='tp3'?'TP3 Hit — signal closed.':effectiveKind==='be'?'Breakeven Hit — signal closed.':effectiveKind==='sl'?'Stop Loss Hit — signal closed.':'Signal closed.','signal','/?tab=signals','all');}catch(e){}}
  loadAdSigList();
}
async function delAdSig(id){if(!(await window.pspConfirm('Delete this signal?')))return;await sb.from('signals').delete().eq('id',id);loadAdSigList();}

function loadAdCharts(){
  var wrap=document.getElementById('adChartWrap');if(!wrap)return;
  wrap.innerHTML='<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:18px">'+
    '<div class="card"><h3 style="margin:0 0 12px">📈 New Official Chart</h3><div style="display:grid;gap:11px">'+
      '<select id="ac-pair" style="'+APMS+'">'+adPairOpts()+'</select>'+
      '<input id="ac-title" placeholder="Title e.g. XAU 4H breakout" style="'+APMS+'">'+
      ''+
      '<input id="ac-file" type="file" accept="image/*" style="'+APMS+'">'+
      '<textarea id="ac-notes" rows="3" placeholder="Analysis notes" style="'+APMS+'"></textarea>'+
      '<button onclick="createAdChart()" style="padding:11px;border:none;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e1a;font-weight:800;cursor:pointer">📊 Publish Official Chart</button>'+
    '</div></div>'+
    '<div class="card"><h3 style="margin:0 0 12px">🖼️ Official Charts</h3><div id="acList">Loading...</div></div></div>';
  loadAdChartList();
}
async function createAdChart(){
  var title=(document.getElementById('ac-title').value||'').trim();if(!title){alert('Title required');return;}
  var aud=['free','premium','vip'];
  var image_url='';var file=document.getElementById('ac-file').files[0];
  if(file){var ext=(file.name.split('.').pop()||'jpg').toLowerCase();var path='official/'+Date.now()+'.'+ext;var up=await sb.storage.from('charts').upload(path,file,{upsert:true});if(up.error){alert('Upload failed: '+up.error.message);return;}image_url=sb.storage.from('charts').getPublicUrl(path).data.publicUrl;}
  var chartObj={owner_id:currentAdmin.id,is_official:true,pair:(window.PSPPairsV216?.value('ac-pair')||document.getElementById('ac-pair').value),title:title,image_url:image_url,audience:aud.join(','),notes:(document.getElementById('ac-notes').value||'').trim()||null};
  var r=await sb.from('charts').insert(chartObj);
  if(r.error){alert('Error: '+r.error.message);return;}
  await pspCreateNotificationAndPush('📈 New Chart Published', (chartObj.title||chartObj.pair+' chart')+' is now available.', 'chart', '/?tab=charts', chartObj.audience||'all');
  document.getElementById('ac-title').value='';document.getElementById('ac-file').value='';document.getElementById('ac-notes').value='';
  loadAdChartList();
}
async function loadAdChartList(){
  var box=document.getElementById('acList');if(!box)return;
  var r=await sb.from('charts').select('*').eq('is_official',true).order('created_at',{ascending:false}).limit(30);
  if(r.error){box.innerHTML='<div style="color:#ef4444">'+aEsc(r.error.message)+'</div>';return;}
  var data=r.data||[];if(!data.length){box.innerHTML='<div style="color:#94a0b8">No official charts yet.</div>';return;}
  box.innerHTML='<div style="display:grid;gap:12px">'+data.map(function(c){
    var aud=(c.audience||'free');var parts=(aud==='all')?['free','premium','vip']:aud.split(',').map(function(x){return x.trim();}).filter(Boolean);var lbl={free:'🆓',premium:'💎',vip:'👑'};
    var ab=parts.map(function(p){return '<span style="font-size:9px;padding:1px 6px;border-radius:10px;background:'+(p==='free'?'rgba(16,185,129,.18);color:#10b981':'rgba(245,158,11,.18);color:#f59e0b')+'">'+(lbl[p]||p)+'</span>';}).join(' ');
    return '<div style="border:1px solid var(--border,#1f2937);border-radius:10px;padding:10px"><div style="display:flex;justify-content:space-between;align-items:center"><div><strong>'+aEsc(c.title)+'</strong> <span style="font-size:11px;color:#94a0b8">'+aEsc(c.pair||'')+'</span> '+ab+'</div><button onclick="delAdChart(\''+c.id+'\')" style="padding:4px 9px;border-radius:7px;background:rgba(239,68,68,.15);border:none;color:#ef4444;cursor:pointer">🗑️</button></div>'+(c.image_url?'<img src="'+aEsc(c.image_url)+'" style="width:100%;border-radius:8px;margin-top:8px">':'')+(c.notes?'<div style="font-size:12px;color:#94a0b8;margin-top:6px">'+aEsc(c.notes)+'</div>':'')+'</div>';
  }).join('')+'</div>';
}
async function delAdChart(id){if(!(await window.pspConfirm('Delete this chart?')))return;await sb.from('charts').delete().eq('id',id);loadAdChartList();}

// ============ COMMUNITY (admin) ============
function loadAdminCommunity(){
  var wrap=document.getElementById('adCommWrap');if(!wrap)return;
  wrap.innerHTML='<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:18px">'+
    '<div class="card"><h3 style="margin:0 0 12px">👥 Create Group</h3><div style="display:grid;gap:11px">'+
      '<input id="gc-name" placeholder="Group name" style="'+APMS+'">'+
      '<textarea id="gc-desc" rows="2" placeholder="Description" style="'+APMS+'"></textarea>'+
      '<div style="display:flex;gap:10px"><input id="gc-icon" maxlength="2" value="🌐" style="'+APMS+';max-width:70px;text-align:center;font-size:18px"><label style="display:flex;align-items:center;gap:7px;font-size:13px;color:#94a0b8;cursor:pointer"><input type="checkbox" id="gc-official" checked> Official (everyone)</label></div>'+
      '<select id="gc-slow" style="'+APMS+'"><option value="0">Slow mode: Off</option><option value="30">1 post / 30s</option><option value="60">1 post / 1 min</option><option value="300">1 post / 5 min</option></select>'+
      '<button onclick="createAdminGroup()" style="padding:11px;border:none;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e1a;font-weight:800;cursor:pointer">➕ Create Group</button>'+
    '</div></div>'+
    '<div class="card"><h3 style="margin:0 0 12px">📋 All Groups</h3><div id="adGroupList">Loading...</div></div></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px">'+
      '<div class="card"><h3 style="margin:0 0 12px">🚩 Reported Posts</h3><div id="adReports">Loading...</div></div>'+
      '<div class="card"><h3 style="margin:0 0 12px">📜 Moderation Log</h3><div id="adAudit">Loading...</div></div></div>';
  loadAdGroupList();loadAdReports();loadAdAudit();
}
async function createAdminGroup(){
  var name=(document.getElementById('gc-name').value||'').trim();if(!name){alert('Group name required');return;}
  var off=document.getElementById('gc-official').checked;
  var r=await sb.from('groups').insert({owner_id:currentAdmin.id,is_official:off,name:name,description:(document.getElementById('gc-desc').value||'').trim()||null,icon:(document.getElementById('gc-icon').value||'🌐'),audience:'all',slow_mode_seconds:parseInt(document.getElementById('gc-slow').value||'0')});
  if(r.error){alert('Error: '+r.error.message);return;}
  document.getElementById('gc-name').value='';document.getElementById('gc-desc').value='';
  loadAdGroupList();
}
async function loadAdReports(){
  var box=document.getElementById('adReports');if(!box)return;
  var r=await sb.from('post_reports').select('*').eq('status','open').order('created_at',{ascending:false}).limit(50);
  if(r.error){box.innerHTML='<div style="color:#ef4444;font-size:12px">'+aEsc(r.error.message)+'</div>';return;}
  var data=r.data||[];if(!data.length){box.innerHTML='<div style="color:#94a0b8;font-size:13px">No open reports 🎉</div>';return;}
  box.innerHTML=data.map(function(rp){return '<div style="padding:10px 0;border-bottom:1px solid var(--border,#1f2937)"><div style="font-size:12px"><strong>'+aEsc(rp.reporter_name||'Member')+'</strong> reported a post</div><div style="font-size:12px;color:#94a0b8;margin:3px 0">"'+aEsc(rp.reason||'')+'"</div><div style="display:flex;gap:6px;margin-top:5px"><button onclick="delReportedPost(\''+rp.post_id+'\',\''+rp.id+'\')" style="padding:4px 10px;border:none;border-radius:7px;background:rgba(239,68,68,.15);color:#ef4444;cursor:pointer;font-size:11px;font-weight:700">Delete post</button><button onclick="resolveReport(\''+rp.id+'\')" style="padding:4px 10px;border:none;border-radius:7px;background:rgba(16,185,129,.15);color:#10b981;cursor:pointer;font-size:11px;font-weight:700">Dismiss</button></div></div>';}).join('');
}
async function delReportedPost(postId,reportId){if(!(await window.pspConfirm('Delete this reported post?')))return;await sb.from('group_posts').delete().eq('id',postId);await sb.from('post_reports').update({status:'resolved'}).eq('id',reportId);try{await sb.from('moderation_log').insert({actor_id:currentAdmin.id,actor_name:'Admin',action:'delete_post',detail:'via report'});}catch(e){}loadAdReports();loadAdAudit();}
async function resolveReport(id){await sb.from('post_reports').update({status:'resolved'}).eq('id',id);try{await sb.from('moderation_log').insert({actor_id:currentAdmin.id,actor_name:'Admin',action:'resolve_report',detail:id});}catch(e){}loadAdReports();loadAdAudit();}
async function loadAdAudit(){
  var box=document.getElementById('adAudit');if(!box)return;
  var r=await sb.from('moderation_log').select('*').order('created_at',{ascending:false}).limit(50);
  if(r.error){box.innerHTML='<div style="color:#ef4444;font-size:12px">'+aEsc(r.error.message)+'</div>';return;}
  var data=r.data||[];if(!data.length){box.innerHTML='<div style="color:#94a0b8;font-size:13px">No actions logged yet.</div>';return;}
  var ico={delete_post:'🗑️',ban:'⛔',mute:'🔇',unban:'✅',resolve_report:'✔️'};
  box.innerHTML=data.map(function(l){return '<div style="padding:8px 0;border-bottom:1px solid var(--border,#1f2937);font-size:12px"><span>'+(ico[l.action]||'•')+' <strong>'+aEsc(l.actor_name||'Mod')+'</strong> '+aEsc((l.action||'').replace('_',' '))+'</span> <span style="color:#94a0b8">'+aEsc(l.detail||'')+'</span><div style="font-size:10px;color:#94a0b8">'+new Date(l.created_at).toLocaleString()+'</div></div>';}).join('');
}
async function loadAdGroupList(){
  var box=document.getElementById('adGroupList');if(!box)return;
  var r=await sb.from('groups').select('*, owner:owner_id(full_name,email)').order('is_official',{ascending:false}).order('created_at',{ascending:true});
  if(r.error){box.innerHTML='<div style="color:#ef4444">'+aEsc(r.error.message)+'</div>';return;}
  var data=r.data||[];if(!data.length){box.innerHTML='<div style="color:#94a0b8">No groups yet.</div>';return;}
  box.innerHTML=data.map(function(g){
    var own=g.is_official?'Official':((g.owner&&(g.owner.full_name||g.owner.email))||'Mentor');
    return '<div style="padding:11px 0;border-bottom:1px solid var(--border,#1f2937);display:flex;justify-content:space-between;align-items:center;gap:8px"><div><strong>'+aEsc(g.icon||'👥')+' '+aEsc(g.name)+'</strong> '+(g.is_official?'<span style="font-size:9px;padding:1px 6px;border-radius:10px;background:rgba(245,158,11,.18);color:#f59e0b">OFFICIAL</span>':'<span style="font-size:9px;padding:1px 6px;border-radius:10px;background:rgba(148,160,184,.18);color:#94a0b8">'+aEsc(g.audience)+'</span>')+'<div style="font-size:11px;color:#94a0b8">by '+aEsc(own)+'</div></div><button onclick="delAdminGroup(\''+g.id+'\')" style="padding:4px 9px;border-radius:7px;background:rgba(239,68,68,.15);border:none;color:#ef4444;cursor:pointer">🗑️</button></div>';
  }).join('');
}
async function delAdminGroup(id){if(!(await window.pspConfirm('Delete this group and all its posts?')))return;await sb.from('groups').delete().eq('id',id);loadAdGroupList();}

// ============ MEMBER CHATS (DM — admin) ============
var _aDmPeer=null,_aDmConvs=[],_aDmRt=false,_aTypeChan=null,_aDmListSeq=0,_aDmOpenSeq=0;
var _aChatEpoch=0,_aChatTab='chats',_aDmSearchSeq=0,_aDmSearchTimer=null,_aDmDrafts={},_aDmSending=new Set(),_aDmSelecting=null;
function aChatCurrent(epoch,tab,node){
  var page=document.getElementById('page-chats');
  return epoch===_aChatEpoch&&currentAdmin&&!document.hidden&&page&&page.classList.contains('active')&&(!tab||_aChatTab===tab)&&(!node||document.getElementById(node.id)===node);
}
function aStopTyping(){
  var ch=_aTypeChan;_aTypeChan=null;
  if(ch&&sb)Promise.resolve(sb.removeChannel(ch)).catch(function(){});
  clearTimeout(_aTypeTimer);var el=document.getElementById('aDmTyping');if(el)el.textContent='';
}
function aIsOnline(ls){return ls&&(Date.now()-new Date(ls)<90000);}
function aDot(ls){return '<span style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;border:2px solid var(--bg-card,#0f1729);background:'+(aIsOnline(ls)?'#10b981':'#6b7280')+'"></span>';}
function aAv(p,s){s=s||40;var u=p&&p.avatar_url;var i=((p&&(p.full_name||p.email)||'M')[0]||'M').toUpperCase();if(u)return '<div style="width:'+s+'px;height:'+s+'px;border-radius:50%;flex:0 0 auto;background:#000 url(\''+u+'\') center/cover"></div>';return '<div style="width:'+s+'px;height:'+s+'px;border-radius:50%;flex:0 0 auto;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;color:#0a0e1a;font-weight:800;font-size:'+Math.round(s*.4)+'px">'+i+'</div>';}
function aNm(p){return aEsc((p&&(p.full_name||p.email))||'Member');}
function renderAdminChats(){
  var w=document.getElementById('adChatsWrap');if(!w)return;
  window.pspAdminChatRealtimeCleanup();_aDmPeer=null;_aChatTab='chats';_acLoaded=false;_acGid=null;_aLiveActive=null;
  w.innerHTML='<div style="display:flex;gap:8px;margin-bottom:14px">'+
    '<button id="actab-chats" onclick="aCommSwitch(\'chats\')" style="padding:9px 18px;border:none;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e1a;font-weight:800;cursor:pointer">💬 Direct Chats</button>'+
    '<button id="actab-comm" onclick="aCommSwitch(\'comm\')" style="padding:9px 18px;border:1px solid var(--border,#1f2937);border-radius:10px;background:transparent;color:var(--text-primary,#e8eaf0);font-weight:700;cursor:pointer">👥 Community</button>'+
    '<button id="actab-live" onclick="aCommSwitch(\'live\')" style="padding:9px 18px;border:1px solid var(--border,#1f2937);border-radius:10px;background:transparent;color:var(--text-primary,#e8eaf0);font-weight:700;cursor:pointer">🤖 Live Desk / AI Chats</button></div>'+
    '<div id="aTabChats"><div style="display:grid;grid-template-columns:300px 1fr;gap:16px;align-items:start;height:calc(100vh - 250px);min-height:460px">'+
    '<div class="card" style="display:flex;flex-direction:column;height:100%;box-sizing:border-box"><h3 style="margin:0 0 10px">✉️ Member Chats</h3>'+
      '<input id="aDmNew" oninput="aDmSearchUsers()" placeholder="🔍 Search members..." style="'+APMS+';margin-bottom:6px"><div id="aDmSearchRes"></div>'+
      '<div style="flex:1;overflow-y:auto;margin-top:6px">'+
        '<div style="font-size:11px;color:#94a0b8;font-weight:700;margin:4px 0 6px">GROUPS & MEMBERS</div><div id="aGroupsBox">Loading...</div>'+
        '<div style="font-size:11px;color:#94a0b8;font-weight:700;margin:14px 0 6px">RECENT CHATS</div><div id="aDmList">No chats yet.</div>'+
      '</div></div>'+
    '<div class="card" style="display:flex;flex-direction:column;height:100%;box-sizing:border-box">'+
      '<div id="aDmHead" style="display:none;align-items:center;gap:10px;border-bottom:1px solid var(--border,#1f2937);padding-bottom:12px;margin-bottom:12px"></div>'+
      '<div id="aDmBody" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px"><div style="margin:auto;color:#94a0b8">Select a member to start chatting.</div></div>'+
      '<div id="aDmTyping" style="font-size:11px;color:#94a0b8;height:14px;padding:0 4px"></div>'+
      '<div id="aDmComposer" style="display:none;gap:8px;margin-top:8px"><input id="aDmInput" oninput="aTypePing()" onkeydown="if(event.key===String.fromCharCode(13))aSendDM()" placeholder="Type a message..." style="'+APMS+';flex:1;border-radius:22px"><button id="aDmSendBtn" onclick="aSendDM()" style="padding:10px 22px;border:none;border-radius:22px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e1a;font-weight:800;cursor:pointer">Send</button></div>'+
    '</div></div></div>'+
    '<div id="aTabComm" style="display:none"><div style="display:grid;grid-template-columns:240px 1fr;gap:16px;align-items:start;height:calc(100vh - 250px);min-height:460px">'+
      '<div class="card" style="height:100%;box-sizing:border-box;overflow-y:auto"><h3 style="margin:0 0 10px">👥 Groups</h3><div id="aCommGroups">Loading...</div></div>'+
      '<div class="card" style="display:flex;flex-direction:column;height:100%;box-sizing:border-box">'+
        '<h3 id="aCommGName" style="margin:0 0 10px">Select a group</h3>'+
        '<div id="aCommComposer" style="display:none;margin-bottom:12px"><textarea id="aCommText" rows="2" placeholder="Share something..." style="'+APMS+';width:100%;box-sizing:border-box"></textarea><div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><label style="font-size:12px;color:#10b981;cursor:pointer">🖼️ Photo<input id="aCommImg" type="file" accept="image/*" style="display:none"></label><button onclick="aCommPost()" style="padding:8px 18px;border:none;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e1a;font-weight:800;cursor:pointer">Post</button></div></div>'+
        '<div id="aCommFeed" style="flex:1;overflow-y:auto"><div style="margin:auto;color:#94a0b8">Pick a group to see posts.</div></div>'+
      '</div></div></div>'+
    '<div id="aTabLive" style="display:none;height:calc(100vh - 250px);min-height:500px">'+
      '<div style="display:grid;grid-template-columns:330px 1fr;gap:16px;height:100%">'+
        '<div class="card" style="height:100%;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden">'+
          '<h3 style="margin:0 0 4px">🤖 Live Desk / AI Chats</h3>'+
          '<div style="font-size:10px;color:#94a0b8;margin-bottom:9px">All website visitor chats including FreeCourse2</div>'+
          '<input id="aLiveSearch" oninput="aLiveSearchDebounce()" placeholder="🔍 Search name, email, WhatsApp, source..." style="'+APMS+';margin-bottom:8px">'+
          '<div id="aLiveList" style="flex:1;overflow-y:auto"><div style="color:#94a0b8;font-size:12px">Open this tab to load chats.</div></div>'+
        '</div>'+
        '<div class="card" style="height:100%;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden">'+
          '<div id="aLiveHead" style="border-bottom:1px solid var(--border,#1f2937);padding-bottom:10px;margin-bottom:10px"><h3 style="margin:0">Select a visitor chat</h3></div>'+
          '<div id="aLiveBody" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px"><div style="margin:auto;color:#94a0b8">Select a chat to view the full conversation.</div></div>'+
        '</div>'+
      '</div>'+
    '</div>';
  aHeartbeat();aLoadDMList();aLoadGroups();
}
function aCommSwitch(tab){
  if(_aChatTab!==tab){aStopTyping();++_aDmOpenSeq;++_aLiveOpenSeq;++_aLiveLoadSeq;++_acFeedSeq;_aLiveLoading=false;_aDmSelecting=null;}
  _aChatTab=tab;window.dispatchEvent(new Event('psp-admin-chat-tab'));
  document.getElementById('aTabChats').style.display=tab==='chats'?'block':'none';
  document.getElementById('aTabComm').style.display=tab==='comm'?'block':'none';
  var live=document.getElementById('aTabLive');if(live)live.style.display=tab==='live'?'block':'none';
  var a=document.getElementById('actab-chats'),b=document.getElementById('actab-comm'),c=document.getElementById('actab-live');
  a.style.background=tab==='chats'?'linear-gradient(135deg,#f59e0b,#d97706)':'transparent';a.style.color=tab==='chats'?'#0a0e1a':'var(--text-primary,#e8eaf0)';a.style.border=tab==='chats'?'none':'1px solid var(--border,#1f2937)';
  b.style.background=tab==='comm'?'linear-gradient(135deg,#f59e0b,#d97706)':'transparent';b.style.color=tab==='comm'?'#0a0e1a':'var(--text-primary,#e8eaf0)';b.style.border=tab==='comm'?'none':'1px solid var(--border,#1f2937)';
  if(c){c.style.background=tab==='live'?'linear-gradient(135deg,#f59e0b,#d97706)':'transparent';c.style.color=tab==='live'?'#0a0e1a':'var(--text-primary,#e8eaf0)';c.style.border=tab==='live'?'none':'1px solid var(--border,#1f2937)';}
  if(tab==='comm')aCommInit();
  if(tab==='chats')window.pspAdminRefreshDM();
  if(tab==='live')aLiveLoad();
}

var _aLiveRows=[],_aLiveActive=null,_aLiveTimer=null,_aLiveLoading=false,_aLiveLoadSeq=0,_aLiveOpenSeq=0;
function aLiveSearchDebounce(){++_aLiveLoadSeq;clearTimeout(_aLiveTimer);_aLiveTimer=setTimeout(function(){aLiveLoad(true)},250);}
async function aLiveLoad(force,silent){
  var box=document.getElementById('aLiveList'),epoch=_aChatEpoch;
  if(!box||!aChatCurrent(epoch,'live',box))return;
  if(_aLiveLoading&&!force)return;
  var seq=++_aLiveLoadSeq,q=(document.getElementById('aLiveSearch')?.value||'').trim()||null;
  _aLiveLoading=true;
  if(!silent&&!_aLiveRows.length)box.innerHTML='<div style="padding:12px;color:#94a0b8;font-size:12px">Loading chats...</div>';
  try{
    var r=await sb.rpc('psp_admin_live_chat_inbox_v308',{p_search:q,p_limit:1000});
    if(seq!==_aLiveLoadSeq||!aChatCurrent(epoch,'live',box))return;
    if(r.error)throw r.error;
    _aLiveRows=Array.isArray(r.data)?r.data:[];aLiveRenderList();
  }catch(e){if(seq===_aLiveLoadSeq&&aChatCurrent(epoch,'live',box)&&!silent)box.innerHTML='<div style="padding:12px;color:#ef4444;font-size:11px">'+aEsc(e&&e.message||String(e))+'</div>';
  }finally{if(seq===_aLiveLoadSeq)_aLiveLoading=false;}
}
function aLiveRenderList(){
  var box=document.getElementById('aLiveList');if(!box)return;
  if(!_aLiveRows.length){box.innerHTML='<div style="padding:16px;color:#94a0b8;font-size:12px">No Live Desk chats found.</div>';return;}
  box.innerHTML=_aLiveRows.map(function(x){
    var on=_aLiveActive&&String(_aLiveActive.id)===String(x.id);
    var nm=x.visitor_name||x.email||x.whatsapp||'Visitor';
    var source=[x.source,x.campaign].filter(Boolean).join(' / ')||'Direct';
    return `<div data-live-id="${aEsc(String(x.id))}" style="padding:10px;border-radius:10px;margin-bottom:5px;cursor:pointer;border:1px solid ${on?'#f59e0b':'transparent'};background:${on?'rgba(245,158,11,.08)':'transparent'}">
      <div style="display:flex;justify-content:space-between;gap:8px"><strong style="font-size:12px">${aEsc(nm)}</strong><span style="font-size:9px;color:#94a0b8">${aEsc(aLiveAgo(x.last_message_at||x.updated_at||x.created_at))}</span></div>
      <div style="font-size:10px;color:#94a0b8;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${aEsc(source)} · ${aEsc(x.current_page||x.first_page||'/')}</div>
    </div>`;
  }).join('');
  box.onclick=function(e){var row=e.target.closest('[data-live-id]');if(row)aLiveOpen(row.getAttribute('data-live-id'));};
}
function aLiveAgo(v){if(!v)return'';var s=Math.max(0,(Date.now()-new Date(v).getTime())/1000);if(s<60)return Math.floor(s)+'s';if(s<3600)return Math.floor(s/60)+'m';if(s<86400)return Math.floor(s/3600)+'h';return Math.floor(s/86400)+'d';}
async function aLiveOpen(id,silent){
  var seq=++_aLiveOpenSeq,epoch=_aChatEpoch;
  _aLiveActive=_aLiveRows.find(function(x){return String(x.id)===String(id)})||{id:id};aLiveRenderList();
  var head=document.getElementById('aLiveHead'),body=document.getElementById('aLiveBody');
  if(!head||!body||!aChatCurrent(epoch,'live',body))return;
  var scroll=body.scrollTop,atBottom=body.scrollHeight-body.scrollTop-body.clientHeight<80;
  var c=_aLiveActive,nm=c.visitor_name||c.email||c.whatsapp||'Visitor',source=[c.source,c.campaign,c.medium].filter(Boolean).join(' / ')||'Direct';
  head.innerHTML='<h3 style="margin:0">'+aEsc(nm)+'</h3><div style="display:flex;gap:12px;flex-wrap:wrap;font-size:10px;color:#94a0b8;margin-top:5px">'+
    '<span>Email: <b style="color:var(--text-primary)">'+aEsc(c.email||'—')+'</b></span>'+
    '<span>WhatsApp: <b style="color:var(--text-primary)">'+aEsc(c.whatsapp||'—')+'</b></span>'+
    '<span>Source: <b style="color:#10b981">'+aEsc(source)+'</b></span>'+
    '<span>Page: <b style="color:var(--text-primary)">'+aEsc(c.first_page||c.current_page||'—')+'</b></span></div>';
  if(!silent)body.innerHTML='<div style="margin:auto;color:#94a0b8">Loading conversation...</div>';
  try{
    var r=await sb.rpc('psp_admin_live_chat_messages_v308',{p_conversation_id:String(id),p_limit:2000});
    if(seq!==_aLiveOpenSeq||!aChatCurrent(epoch,'live',body)||String(_aLiveActive?.id)!==String(id))return;
    if(r.error)throw r.error;var rows=Array.isArray(r.data)?r.data:[];
    body.innerHTML=rows.length?rows.map(function(m){
      var t=String(m.sender_type||'visitor').toLowerCase(),right=t!=='visitor';
      return '<div style="max-width:78%;align-self:'+(right?'flex-end':'flex-start')+';padding:8px 11px;border-radius:12px;background:'+(right?'rgba(245,158,11,.12)':'var(--bg-elevated,#162033)')+';border:1px solid '+(right?'rgba(245,158,11,.22)':'var(--border,#1f2937)')+'">'+
        '<div style="font-size:8.5px;color:#94a0b8;margin-bottom:3px">'+aEsc(m.sender_name||t)+' · '+aEsc(m.created_at?new Date(m.created_at).toLocaleString():'')+'</div>'+
        '<div style="font-size:11px;line-height:1.45;white-space:pre-wrap">'+aEsc(m.body||'')+'</div></div>';
    }).join(''):'<div style="margin:auto;color:#94a0b8">No messages in this conversation.</div>';
    body.scrollTop=(!silent||atBottom)?body.scrollHeight:scroll;
  }catch(e){if(seq===_aLiveOpenSeq&&aChatCurrent(epoch,'live',body)&&!silent)body.innerHTML='<div style="margin:auto;color:#ef4444">'+aEsc(e&&e.message||String(e))+'</div>';}
}
function aLiveOpenActive(){if(_aLiveActive)return aLiveOpen(_aLiveActive.id,true);}
setInterval(function(){if(aChatCurrent(_aChatEpoch,'live')){aLiveLoad(false,true);aLiveOpenActive();}},30000);

var _acLoaded=false,_acGid=null,_acGroups=[],_acOpenC={},_acFeedSeq=0,_acInitSeq=0,_acPosting=false;
async function aCommInit(){
  var seq=++_acInitSeq,epoch=_aChatEpoch;var r=await sb.from('groups').select('*').order('is_official',{ascending:false}).order('created_at',{ascending:true});
  if(seq!==_acInitSeq||!aChatCurrent(epoch,'comm'))return;
  if(r.error){_acLoaded=false;return;}_acLoaded=true;_acGroups=r.data||[];aCommRenderGroups();
  if(_acGroups.length)aCommSelect(_acGroups.some(function(g){return g.id===_acGid;})?_acGid:_acGroups[0].id);
}
function aCommRenderGroups(){var box=document.getElementById('aCommGroups');if(!box)return;if(!_acGroups.length){box.innerHTML='<div style="color:#94a0b8;font-size:12px">No groups.</div>';return;}box.innerHTML=_acGroups.map(function(g){var sel=_acGid===g.id;return '<div onclick="aCommSelect(\''+g.id+'\')" style="padding:9px 10px;border-radius:9px;cursor:pointer;margin-bottom:5px;border:1px solid '+(sel?'#f59e0b':'transparent')+';background:'+(sel?'rgba(245,158,11,.08)':'transparent')+'"><span style="font-size:15px">'+(g.icon||'👥')+'</span> <strong style="font-size:13px">'+aEsc(g.name)+'</strong></div>';}).join('');}
function aCommSelect(gid){_acGid=gid;aCommRenderGroups();var g=_acGroups.find(function(x){return x.id===gid;});if(g)document.getElementById('aCommGName').textContent=(g.icon||'👥')+' '+g.name;document.getElementById('aCommComposer').style.display='block';aCommFeed();}
async function aCommFeed(){
  var feed=document.getElementById('aCommFeed'),epoch=_aChatEpoch,seq=++_acFeedSeq,gid=_acGid;if(!feed||!gid||!aChatCurrent(epoch,'comm',feed))return;
  var pr=await sb.from('group_posts').select('*, author:author_id(full_name,email,avatar_url)').eq('group_id',gid).order('pinned',{ascending:false}).order('created_at',{ascending:false}).limit(60);
  if(seq!==_acFeedSeq||gid!==_acGid||!aChatCurrent(epoch,'comm',feed)||pr.error)return;
  var posts=pr.data||[];var ids=posts.map(function(p){return p.id;});var likes=[],comments=[];
  if(ids.length){likes=(await sb.from('post_likes').select('post_id,user_id').in('post_id',ids)).data||[];comments=(await sb.from('post_comments').select('*, author:author_id(full_name,email,avatar_url)').in('post_id',ids).order('created_at',{ascending:true})).data||[];}
  if(seq!==_acFeedSeq||gid!==_acGid||!aChatCurrent(epoch,'comm',feed))return;
  if(!posts.length){feed.innerHTML='<div style="margin:auto;color:#94a0b8">No posts yet.</div>';return;}
  feed.innerHTML=posts.map(function(p){
    var pl=likes.filter(function(l){return l.post_id===p.id;});var liked=pl.some(function(l){return l.user_id===currentAdmin.id;});
    var pc=comments.filter(function(c){return c.post_id===p.id&&!c.parent_id;});var open=_acOpenC[p.id];
    var cH=open?('<div style="margin-top:10px;border-top:1px solid var(--border,#1f2937);padding-top:10px">'+pc.map(function(c){return '<div style="display:flex;gap:8px;margin-bottom:8px">'+aAv(c.author,28)+'<div style="background:rgba(255,255,255,.05);border-radius:12px;padding:7px 11px"><strong style="font-size:12px">'+aNm(c.author)+'</strong><div style="font-size:12px">'+aEsc(c.content||'')+'</div></div></div>';}).join('')+'<div style="display:flex;gap:6px;margin-top:6px"><input id="acc-'+p.id+'" placeholder="Write a comment..." style="'+APMS+';flex:1;border-radius:18px" onkeydown="if(event.key===String.fromCharCode(13))aCommAddComment(\''+p.id+'\')"><button onclick="aCommAddComment(\''+p.id+'\')" style="padding:6px 14px;border:none;border-radius:18px;background:#f59e0b;color:#0a0e1a;font-weight:800;cursor:pointer">Send</button></div></div>'):'';
    return '<div class="card" style="margin-bottom:12px">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'+aAv(p.author,40)+'<div><div style="font-weight:700;font-size:13px">'+aNm(p.author)+'</div><div style="font-size:10px;color:#94a0b8">'+new Date(p.created_at).toLocaleString()+'</div></div></div>'+
      (p.content?'<div style="font-size:14px;line-height:1.55;white-space:pre-wrap;margin-bottom:'+(p.image_url?'8px':'0')+'">'+aEsc(p.content)+'</div>':'')+
      (p.image_url?'<img src="'+p.image_url+'" style="width:100%;border-radius:10px">':'')+
      '<div style="display:flex;gap:8px;margin-top:8px;border-top:1px solid var(--border,#1f2937);padding-top:6px">'+
        '<button onclick="aCommLike(\''+p.id+'\')" style="flex:1;background:none;border:none;cursor:pointer;color:'+(liked?'#ef4444':'#94a0b8')+';font-weight:700;font-size:13px;padding:6px">'+(liked?'❤️':'🤍')+' '+pl.length+'</button>'+
        '<button onclick="_acOpenC[\''+p.id+'\']=!_acOpenC[\''+p.id+'\'];aCommFeed()" style="flex:1;background:none;border:none;cursor:pointer;color:#94a0b8;font-weight:700;font-size:13px;padding:6px">💬 '+pc.length+'</button>'+
      '</div>'+cH+'</div>';
  }).join('');
}
async function aCommPost(){
  if(_acPosting||!currentAdmin||!_acGid)return;
  var input=document.getElementById('aCommText'),fileInput=document.getElementById('aCommImg'),txt=(input.value||'').trim(),f=fileInput.files[0],gid=_acGid,me=currentAdmin.id,epoch=_aChatEpoch,img=null;
  if(!txt&&!f)return;_acPosting=true;
  try{
    if(f){var ext=(f.name.split('.').pop()||'jpg'),path='community/'+me+'_'+Date.now()+'.'+ext,up=await sb.storage.from('charts').upload(path,f,{upsert:true});if(up.error)throw up.error;img=sb.storage.from('charts').getPublicUrl(path).data.publicUrl;}
    var r=await sb.from('group_posts').insert({group_id:gid,author_id:me,content:txt||null,image_url:img});if(r.error)throw r.error;
    if(aChatCurrent(epoch,'comm',input)&&gid===_acGid){if(input.value.trim()===txt)input.value='';if(fileInput.files[0]===f)fileInput.value='';aCommFeed();}
  }catch(e){alert('Post was not saved: '+(e.message||e));}finally{_acPosting=false;}
}
async function aCommLike(pid){try{var ex=await sb.from('post_likes').select('id').eq('post_id',pid).eq('user_id',currentAdmin.id).maybeSingle();if(ex.data)await sb.from('post_likes').delete().eq('id',ex.data.id);else await sb.from('post_likes').insert({post_id:pid,user_id:currentAdmin.id});}catch(e){}aCommFeed();}
async function aCommAddComment(pid){var el=document.getElementById('acc-'+pid);var t=(el&&el.value||'').trim();if(!t)return;await sb.from('post_comments').insert({post_id:pid,author_id:currentAdmin.id,content:t});_acOpenC[pid]=true;aCommFeed();}
var _aGroups=[],_aGroupOpen={},_aGroupMembers={};
async function aLoadGroups(){
  var box=document.getElementById('aGroupsBox'),epoch=_aChatEpoch;if(!box)return;
  var r=await sb.from('groups').select('*, owner:owner_id(full_name,email)').order('is_official',{ascending:false}).order('created_at',{ascending:true});
  if(!aChatCurrent(epoch,null,box)||r.error)return;
  _aGroups=[{id:'__all',name:'All Members',icon:'🌐',_virtual:true}].concat(r.data||[]);
  aRenderGroups();
}
function aRenderGroups(){
  var box=document.getElementById('aGroupsBox');if(!box)return;
  box.innerHTML=_aGroups.map(function(g){
    var open=_aGroupOpen[g.id];
    var sub=g._virtual?'':(g.is_official?'Official':(g.owner&&(g.owner.full_name||g.owner.email)||'Mentor'));
    var head='<div onclick="aToggleGroup(\''+g.id+'\')" style="display:flex;align-items:center;gap:8px;padding:8px 6px;border-radius:8px;cursor:pointer"><span style="font-size:16px">'+(g.icon||'👥')+'</span><div style="flex:1;min-width:0"><strong style="font-size:13px">'+aEsc(g.name)+'</strong>'+(sub?'<div style="font-size:10px;color:#94a0b8">'+aEsc(sub)+'</div>':'')+'</div><span style="color:#94a0b8">'+(open?'▾':'▸')+'</span></div>';
    var mem=open?('<div style="padding:0 0 6px 10px">'+(_aGroupMembers[g.id]?aMembersHTML(_aGroupMembers[g.id]):'<div style="font-size:11px;color:#94a0b8;padding:4px">Loading...</div>')+'</div>'):'';
    return '<div style="border-bottom:1px solid var(--border,#1f2937)">'+head+mem+'</div>';
  }).join('');
}
function aMembersHTML(list){
  if(!list.length)return '<div style="font-size:11px;color:#94a0b8;padding:4px">No members.</div>';
  return list.map(function(m){return '<div onclick="aOpenDM(\''+m.id+'\')" style="display:flex;align-items:center;gap:8px;padding:6px;border-radius:8px;cursor:pointer"><div style="position:relative">'+aAv(m,28)+aDot(m.last_seen)+'</div><div style="font-size:12px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+aNm(m)+'</div></div>';}).join('');
}
async function aToggleGroup(gid){
  _aGroupOpen[gid]=!_aGroupOpen[gid];aRenderGroups();
  if(_aGroupOpen[gid]&&!_aGroupMembers[gid]){
    var g=_aGroups.find(function(x){return x.id===gid;});var members=[];
    try{
      if(gid==='__all'||g.is_official){var r=await sb.from('profiles').select('id,full_name,email,avatar_url,last_seen').order('last_seen',{ascending:false,nullsFirst:false}).limit(300);members=r.data||[];}
      else{var q=sb.from('profiles').select('id,full_name,email,avatar_url,last_seen,member_type').eq('mentor_id',g.owner_id);if(g.audience==='premium')q=q.in('member_type',['premium','vip']);else if(g.audience==='vip')q=q.eq('member_type','vip');var r2=await q.limit(200);members=r2.data||[];}
    }catch(e){}
    members=members.filter(function(m){return m.id!==currentAdmin.id;});
    _aGroupMembers[gid]=members;aRenderGroups();
  }
}
async function aHeartbeat(){try{await sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',currentAdmin.id);}catch(e){}}
setInterval(function(){if(!document.hidden&&typeof currentAdmin!=='undefined'&&currentAdmin&&sb)aHeartbeat();},180000);
function aDmInitRt(){return;}
window.pspAdminChatRealtimeCleanup=function(){var input=document.getElementById('aDmInput');if(_aDmPeer&&input)_aDmDrafts[_aDmPeer.id]=input.value;++_aChatEpoch;++_aDmOpenSeq;++_aDmListSeq;++_aDmSearchSeq;++_aLiveLoadSeq;++_aLiveOpenSeq;++_acInitSeq;++_acFeedSeq;_aLiveLoading=false;_aDmSelecting=null;clearTimeout(_aLiveTimer);clearTimeout(_aDmSearchTimer);aStopTyping();};
function aDmSearchUsers(){
  var input=document.getElementById('aDmNew'),box=document.getElementById('aDmSearchRes'),q=(input?.value||'').trim(),seq=++_aDmSearchSeq,epoch=_aChatEpoch;
  clearTimeout(_aDmSearchTimer);if(!box)return;if(q.length<2){box.innerHTML='';return;}
  _aDmSearchTimer=setTimeout(async function(){
    try{var safe=q.replace(/[,().%_*]/g,' '),r=await sb.from('profiles').select('id,full_name,email,avatar_url,last_seen').or('full_name.ilike.%'+safe+'%,email.ilike.%'+safe+'%').limit(8);
    if(seq!==_aDmSearchSeq||!aChatCurrent(epoch,'chats',box))return;
    if(r.error)throw r.error;var data=(r.data||[]).filter(function(u){return u.id!==currentAdmin.id;});
    box.innerHTML=data.length?('<div style="border:1px solid var(--border,#1f2937);border-radius:10px;padding:4px;margin-bottom:6px">'+data.map(function(u){return '<div onclick="aOpenDM(\''+u.id+'\')" style="display:flex;align-items:center;gap:8px;padding:7px;border-radius:8px;cursor:pointer">'+aAv(u,30)+'<div style="font-size:13px">'+aNm(u)+'</div></div>';}).join('')+'</div>'):'<div style="font-size:12px;color:#94a0b8;padding:4px">No match</div>';
    }catch(e){if(seq===_aDmSearchSeq&&aChatCurrent(epoch,'chats',box))box.textContent='Search could not load. Please retry.';}
  },250);
}
async function aLoadDMList(){
  if(!currentAdmin||!sb)return;var epoch=_aChatEpoch,seq=++_aDmListSeq;aDmInitRt();var me=currentAdmin.id;
  var r=await sb.from('dm_messages').select('*').or('sender_id.eq.'+me+',recipient_id.eq.'+me).order('created_at',{ascending:false}).limit(400);
  if(seq!==_aDmListSeq||!aChatCurrent(epoch,'chats')||r.error)return;
  var msgs=r.data||[];var byPeer={};
  msgs.forEach(function(m){var peer=m.sender_id===me?m.recipient_id:m.sender_id;if(!byPeer[peer])byPeer[peer]={last:m,unread:0};if(m.recipient_id===me&&!m.read_at)byPeer[peer].unread++;});
  var ids=Object.keys(byPeer),profs={};
  if(ids.length){var pr=await sb.from('profiles').select('id,full_name,email,avatar_url,last_seen').in('id',ids);if(seq!==_aDmListSeq)return;(pr.data||[]).forEach(function(p){profs[p.id]=p;});}
  if(seq!==_aDmListSeq||!aChatCurrent(epoch,'chats'))return;
  _aDmConvs=ids.map(function(id){return {prof:profs[id]||{id:id,full_name:'Member'},last:byPeer[id].last,unread:byPeer[id].unread};}).sort(function(a,b){return new Date(b.last.created_at)-new Date(a.last.created_at);});
  var box=document.getElementById('aDmList');if(!box)return;
  if(!_aDmConvs.length){box.innerHTML='<div style="color:#94a0b8;font-size:13px">No chats yet. Search a member above.</div>';return;}
  box.innerHTML=_aDmConvs.map(function(c){var sel=_aDmPeer&&_aDmPeer.id===c.prof.id;var prev=(c.last.sender_id===me?'You: ':'')+(c.last.body||'');return '<div onclick="aOpenDM(\''+c.prof.id+'\')" style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;cursor:pointer;margin-bottom:4px;background:'+(sel?'rgba(245,158,11,.08)':'transparent')+';border:1px solid '+(sel?'#f59e0b':'transparent')+'"><div style="position:relative">'+aAv(c.prof,38)+aDot(c.prof.last_seen)+'</div><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between"><strong style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+aNm(c.prof)+'</strong>'+(c.unread?'<span style="background:#ef4444;color:#fff;font-size:9px;font-weight:800;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px">'+c.unread+'</span>':'')+'</div><div style="font-size:11px;color:#94a0b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+aEsc(prev.slice(0,36))+'</div></div></div>';}).join('');
}
async function aOpenDM(peerId,peerObj,silent){
  if(silent&&_aDmSelecting)return;
  if(!currentAdmin||!sb||!aChatCurrent(_aChatEpoch,'chats'))return;var epoch=_aChatEpoch,seq=++_aDmOpenSeq,requestedPeer=String(peerId),me=currentAdmin.id;
  if(!silent){_aDmSelecting=requestedPeer;var input=document.getElementById('aDmInput');if(_aDmPeer&&input)_aDmDrafts[_aDmPeer.id]=input.value;aStopTyping();_aDmPeer=peerObj||{id:peerId,full_name:'Member'};if(input){input.value=_aDmDrafts[peerId]||'';input.disabled=_aDmSending.has(requestedPeer);}}
  if(!silent){++_aDmSearchSeq;clearTimeout(_aDmSearchTimer);document.getElementById('aDmNew').value='';document.getElementById('aDmSearchRes').innerHTML='';}
  if(!peerObj){var pr=await sb.from('profiles').select('id,full_name,email,avatar_url,last_seen').eq('id',peerId).maybeSingle();if(seq!==_aDmOpenSeq||!aChatCurrent(epoch,'chats'))return;if(pr.error){_aDmSelecting=null;document.getElementById('aDmBody').textContent='Member could not load. Please retry.';return;}peerObj=pr.data;}
  if(seq!==_aDmOpenSeq||!aChatCurrent(epoch,'chats'))return;if(!peerObj)peerObj={id:peerId,full_name:'Member'};_aDmPeer=peerObj;
  var head=document.getElementById('aDmHead');head.style.display='flex';
  head.innerHTML='<div style="position:relative">'+aAv(peerObj,40)+aDot(peerObj.last_seen)+'</div><div><div style="font-weight:700;font-size:15px">'+aNm(peerObj)+'</div><div style="font-size:11px;color:#94a0b8">'+(aIsOnline(peerObj.last_seen)?'🟢 Online':'Offline')+'</div></div>';
  document.getElementById('aDmComposer').style.display='flex';
  var sendBtn=document.getElementById('aDmSendBtn');if(sendBtn)sendBtn.disabled=_aDmSending.has(requestedPeer);
  if(!silent)document.getElementById('aDmBody').innerHTML='<div style="margin:auto;color:#94a0b8">Loading conversation...</div>';
  var r=await sb.from('dm_messages').select('*').or('and(sender_id.eq.'+me+',recipient_id.eq.'+peerId+'),and(sender_id.eq.'+peerId+',recipient_id.eq.'+me+')').order('created_at',{ascending:false}).limit(500);
  if(seq!==_aDmOpenSeq||!aChatCurrent(epoch,'chats')||!_aDmPeer||String(_aDmPeer.id)!==requestedPeer)return;
  _aDmSelecting=null;
  var body=document.getElementById('aDmBody');if(r.error){if(!silent)body.textContent='Conversation could not load. Please retry.';return;}
  var msgs=(r.data||[]).slice().reverse(),scroll=body.scrollTop;var atB=body.scrollHeight-body.scrollTop-body.clientHeight<80;
  var lastMine=null;msgs.forEach(function(m){if(m.sender_id===me)lastMine=m;});
  body.innerHTML=msgs.map(function(m){var mine=m.sender_id===me;var seen=(mine&&m===lastMine&&m.read_at)?'<div style="font-size:10px;color:#94a0b8;text-align:right;margin-top:2px">Seen</div>':'';return '<div style="align-self:'+(mine?'flex-end':'flex-start')+';max-width:72%"><div style="font-size:10px;color:#94a0b8;margin-bottom:2px;'+(mine?'text-align:right':'')+'">'+(mine?'You':aNm(_aDmPeer))+'</div><div style="padding:9px 13px;border-radius:16px;font-size:14px;line-height:1.45;background:'+(mine?'linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e1a':'rgba(255,255,255,.06);color:var(--text-primary,#e8eaf0)')+'">'+aEsc(m.body||'')+'</div>'+seen+'</div>';}).join('')||'<div style="margin:auto;color:#94a0b8">Say hi 👋</div>';
  body.scrollTop=(atB||!silent)?body.scrollHeight:scroll;
  var unread=msgs.filter(function(m){return m.recipient_id===me&&!m.read_at;});
  if(unread.length){try{await sb.from('dm_messages').update({read_at:new Date().toISOString()}).in('id',unread.map(function(m){return m.id;}));}catch(e){}}
  if(seq!==_aDmOpenSeq||!aChatCurrent(epoch,'chats')||String(_aDmPeer?.id)!==requestedPeer)return;
  if(unread.length||!silent)aLoadDMList();
  if(!_aTypeChan){var ck=[me,peerId].sort().join('_');try{if(_aTypeChan)sb.removeChannel(_aTypeChan);}catch(e){}_aTypeChan=sb.channel('dm-typing-'+ck);_aTypeChan.on('broadcast',{event:'typing'},function(p){if(aChatCurrent(epoch,'chats')&&String(_aDmPeer?.id)===requestedPeer&&p.payload&&p.payload.from===peerId)aShowTyping();}).subscribe();}
}
window.pspAdminRefreshDM=function(){if(!aChatCurrent(_aChatEpoch,'chats'))return;return Promise.allSettled([aLoadDMList(),_aDmPeer?aOpenDM(_aDmPeer.id,_aDmPeer,true):Promise.resolve()]);};
var _aTypeTimer=null;function aShowTyping(){var t=document.getElementById('aDmTyping');if(!t||!_aDmPeer)return;t.textContent=aNm(_aDmPeer)+' is typing...';clearTimeout(_aTypeTimer);_aTypeTimer=setTimeout(function(){t.textContent='';},2500);}
var _aPing=0;function aTypePing(){if(!_aTypeChan)return;var n=Date.now();if(n-_aPing<1200)return;_aPing=n;try{_aTypeChan.send({type:'broadcast',event:'typing',payload:{from:currentAdmin.id}});}catch(e){}}
async function aSendDM(){
  if(!currentAdmin||!sb||!_aDmPeer)return;
  var peer=String(_aDmPeer.id),me=currentAdmin.id,epoch=_aChatEpoch,inp=document.getElementById('aDmInput'),btn=document.getElementById('aDmSendBtn'),txt=(inp?.value||'').trim();
  if(!txt||_aDmSending.has(peer))return;_aDmSending.add(peer);inp.disabled=true;if(btn)btn.disabled=true;
  try{
    var r=await sb.from('dm_messages').insert({sender_id:me,recipient_id:peer,body:txt});if(r.error)throw r.error;
    _aDmDrafts[peer]='';
    if(aChatCurrent(epoch,'chats',inp)&&String(_aDmPeer?.id)===peer){inp.value='';await window.pspAdminRefreshDM();}
  }catch(e){if(aChatCurrent(epoch,'chats',inp)&&String(_aDmPeer?.id)===peer)alert('Message was not sent: '+(e.message||e));}
  finally{_aDmSending.delete(peer);if(aChatCurrent(epoch,'chats',inp)&&String(_aDmPeer?.id)===peer){inp.disabled=false;if(btn)btn.disabled=false;}}
}

// ============ SUPPORT MESSAGES (admin inbox - threaded) ============
// ============ SUPPORT (admin — ticket based) ============
var _tickets={};var _selTicket=null;var _msgSig='',_msgLoadSeq=0,_supportDrafts={},_supportSending=new Set();
async function loadAdminMessages(silent){
  var box=document.getElementById('messagesInbox');if(!box||!sb||!currentAdmin)return;var seq=++_msgLoadSeq,me=currentAdmin.id;
  var r=await sb.from('support_messages').select('*').order('created_at',{ascending:false}).limit(1000);
  if(seq!==_msgLoadSeq||currentAdmin?.id!==me||document.getElementById('messagesInbox')!==box)return;
  if(r.error){if(!silent)box.innerHTML='<div style="padding:16px;color:#ef4444;font-size:12px">'+aEsc(r.error.message)+'</div>';return;}
  var rows=(r.data||[]).slice().reverse();
  var sig=JSON.stringify(rows.map(function(m){return [m.id,m.body,m.admin_reply,m.status,m.closed_at];}));
  if(silent&&sig===_msgSig)return;_msgSig=sig;
  _tickets={};
  rows.forEach(function(m){
    var key=(m.user_id||'unknown')+'|'+(m.closed_at||'ACTIVE');
    if(!_tickets[key])_tickets[key]={key:key,user_id:m.user_id,name:m.name||m.email||'User',email:m.email||'',closed:!!m.closed_at,msgs:[]};
    if(m.sender!=='admin')_tickets[key].name=m.name||_tickets[key].name;
    _tickets[key].msgs.push(m);
  });
  var list=Object.values(_tickets).sort(function(a,b){
    if(a.closed!==b.closed)return a.closed?1:-1;
    var au=(!a.closed&&a.msgs[a.msgs.length-1].sender!=='admin')?1:0;
    var bu=(!b.closed&&b.msgs[b.msgs.length-1].sender!=='admin')?1:0;
    if(au!==bu)return bu-au;
    return new Date(b.msgs[b.msgs.length-1].created_at)-new Date(a.msgs[a.msgs.length-1].created_at);
  });
  if(!list.length){box.innerHTML='<div class="empty-state" style="height:220px;"><div class="empty-icon">📭</div><div style="font-size:13px;">No messages yet</div><div style="font-size:11px;color:var(--text-muted);margin-top:4px;">User support tickets will appear here</div></div>';return;}
  box.innerHTML=list.map(function(t){
    var last=t.msgs[t.msgs.length-1];
    var unread=!t.closed&&last.sender!=='admin';
    var subj=(t.msgs[0]&&t.msgs[0].subject)?t.msgs[0].subject:'';
    var badge=t.closed?'<span style="font-size:10px;padding:1px 7px;border-radius:10px;background:rgba(148,160,184,.18);color:#94a0b8">CLOSED</span>':'<span style="font-size:10px;padding:1px 7px;border-radius:10px;background:'+(unread?'rgba(245,158,11,.2);color:#f59e0b':'rgba(16,185,129,.18);color:#10b981')+'">'+(unread?'NEW':'REPLIED')+'</span>';
    return '<div data-ticket-key="'+aEsc(t.key)+'" data-unread="'+(unread?'1':'0')+'" onclick="selectTicket(\''+t.key+'\')" style="padding:12px 14px;border-radius:10px;cursor:pointer;margin:4px;border:1px solid '+((_selTicket===t.key)?'var(--gold,#f59e0b)':(unread?'rgba(245,158,11,.35)':'var(--border,#1f2937)'))+';background:'+((_selTicket===t.key)?'rgba(245,158,11,.08)':(unread?'rgba(245,158,11,.06)':'transparent'))+';'+(t.closed?'opacity:.75;':'')+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><strong style="font-size:13px">'+aEsc(t.name)+'</strong>'+badge+'</div>'+
      (subj?'<div style="font-size:11px;color:var(--text-primary,#e8eaf0);margin-top:2px;font-weight:600">'+aEsc(subj.slice(0,40))+'</div>':'')+
      '<div style="font-size:11px;color:#94a0b8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+aEsc((last.body||'').slice(0,46))+'</div>'+
      '<div style="font-size:10px;color:#94a0b8;margin-top:4px">💬 '+t.msgs.length+' · '+new Date(last.created_at).toLocaleString()+'</div>'+
    '</div>';
  }).join('');
  if(_selTicket&&_tickets[_selTicket])renderTicket(_selTicket,true);
}
function selectTicket(key){var input=document.getElementById('msgReplyText');if(_selTicket&&input)_supportDrafts[_selTicket]=input.value;_selTicket=key;if(input)input.value=_supportDrafts[key]||'';renderTicket(key);highlightTicket(key);}
function highlightTicket(key){var box=document.getElementById('messagesInbox');if(!box)return;Array.from(box.children).forEach(function(row){var selected=row.dataset.ticketKey===key,unread=row.dataset.unread==='1';row.style.borderColor=selected?'var(--gold,#f59e0b)':(unread?'rgba(245,158,11,.35)':'var(--border,#1f2937)');row.style.background=selected?'rgba(245,158,11,.08)':(unread?'rgba(245,158,11,.06)':'transparent');});}
function renderTicket(key,keepScroll){
  var t=_tickets[key];if(!t)return;
  document.getElementById('msgThreadTitle').textContent='💬 '+t.name+(t.closed?' · 🔒 Closed':'');
  document.getElementById('msgThreadMeta').textContent=(t.email||'')+' · '+t.msgs.length+' messages';
  document.getElementById('msgDeleteBtn').style.display='';
  var cbtn=document.getElementById('msgCloseBtn');if(cbtn)cbtn.style.display=t.closed?'none':'';
  var body=document.getElementById('msgThreadBody');
  var scroll=body.scrollTop,atBottom=keepScroll?(body.scrollHeight-body.scrollTop-body.clientHeight<60):true;
  body.style.cssText='flex:1;padding:16px;background:var(--bg-elevated);border-radius:10px;margin:6px 0 12px;min-height:200px;max-height:420px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;';
  body.innerHTML=t.msgs.map(function(m){
    var admin=m.sender==='admin';
    return '<div style="align-self:'+(admin?'flex-end':'flex-start')+';max-width:75%;">'+
      '<div style="font-size:10px;color:#94a0b8;margin-bottom:3px;'+(admin?'text-align:right':'')+'">'+(admin?'↩️ Support':'📨 '+aEsc(t.name))+' · '+new Date(m.created_at).toLocaleString()+'</div>'+
      '<div style="padding:10px 13px;border-radius:12px;font-size:13px;line-height:1.5;background:'+(admin?'rgba(245,158,11,.16);color:#f59e0b':'var(--bg-card,#0f1729);color:var(--text-primary,#e8eaf0)')+'">'+aEsc(m.body||(m.admin_reply||''))+'</div>'+
    '</div>';
  }).join('');
  body.scrollTop=atBottom?body.scrollHeight:scroll;
  var rt=document.getElementById('msgReplyText');var btn=document.getElementById('msgSendBtn');
  if(t.closed){btn.disabled=true;btn.style.opacity='.5';if(rt){rt.disabled=true;rt.placeholder='This ticket is closed.';}}
  else{var sending=_supportSending.has(key);btn.disabled=sending;btn.style.opacity=sending?'.5':'1';if(rt){rt.disabled=sending;rt.placeholder='Type your reply here...';}}
  if(cbtn)cbtn.disabled=_supportSending.has(key);var del=document.getElementById('msgDeleteBtn');if(del)del.disabled=_supportSending.has(key);
}
async function sendSupportReply(){
  var key=_selTicket,t=_tickets[key];if(!t){alert('Select a conversation first');return;}if(t.closed||_supportSending.has(key))return;
  var me=currentAdmin?.id,input=document.getElementById('msgReplyText'),txt=(input.value||'').trim();if(!txt){alert('Type a reply');return;}
  _supportSending.add(key);renderTicket(key,true);
  try{
    var r=await sb.from('support_messages').insert({user_id:t.user_id,sender:'admin',name:'Support',email:(t.email||null),subject:'Re:',body:txt,status:'replied'});if(r.error)throw r.error;
    if(currentAdmin?.id!==me)return;_supportDrafts[key]='';if(_selTicket===key&&input.value.trim()===txt)input.value='';
    _msgSig='';await loadAdminMessages(true);
  }catch(e){alert('Reply was not sent: '+(e.message||e));}
  finally{_supportSending.delete(key);if(currentAdmin?.id===me&&_selTicket===key)renderTicket(key,true);}
}
function clearSelectedSupportTicket(key){
  delete _supportDrafts[key];if(_selTicket!==key)return;_selTicket=null;
  document.getElementById('msgThreadTitle').textContent='Select a message';
  document.getElementById('msgThreadMeta').textContent='Click a conversation from the inbox to view and reply';
  document.getElementById('msgThreadBody').innerHTML='No conversation selected';
  var input=document.getElementById('msgReplyText');input.value='';input.disabled=true;
  document.getElementById('msgDeleteBtn').style.display='none';
  var cb=document.getElementById('msgCloseBtn');if(cb)cb.style.display='none';
  var btn=document.getElementById('msgSendBtn');btn.disabled=true;btn.style.opacity='.5';
}
async function closeAdminTicket(){
  var key=_selTicket,t=_tickets[key];if(!t||t.closed||_supportSending.has(key))return;
  if(!(await window.pspConfirm('Close this ticket? It will move to a separate closed box.')))return;
  try{var r=await sb.rpc('close_support_ticket',{p_user:t.user_id});if(r.error)throw r.error;
  clearSelectedSupportTicket(key);_msgSig='';loadAdminMessages();
  }catch(e){alert('Ticket was not closed: '+(e.message||e));}
}
async function deleteSupportMsg(){
  var key=_selTicket,t=_tickets[key];if(!t||_supportSending.has(key))return;
  if(!(await window.pspConfirm('Delete this ticket permanently?')))return;
  try{var r=t.closed?await sb.from('support_messages').delete().in('id',t.msgs.map(function(m){return m.id;})):await sb.from('support_messages').delete().eq('user_id',t.user_id).is('closed_at',null);
  if(r.error)throw r.error;clearSelectedSupportTicket(key);_msgSig='';loadAdminMessages();
  }catch(e){alert('Ticket was not deleted: '+(e.message||e));}
}
window.addEventListener('psp-admin-auth-closed',function(){++_msgLoadSeq;_aDmDrafts={};_supportDrafts={};_tickets={};_selTicket=null;_msgSig='';});

// ============ NOTIFICATIONS (admin) ============
function previewNotif(){
  var t=(document.getElementById('ntfTitle').value||'').trim()||'(no title)';
  var b=(document.getElementById('ntfBody').value||'').trim()||'(no message)';
  alert('🔔 PREVIEW\n\n'+t+'\n\n'+b);
}
async function sendAdminNotif(){
  var title=(document.getElementById('ntfTitle').value||'').trim();
  var body=(document.getElementById('ntfBody').value||'').trim();
  if(!title||!body){alert('Title and message are required');return;}
  var obj={owner_id:currentAdmin.id,is_official:true,title:title,body:body,type:document.getElementById('ntfType').value,audience:document.getElementById('ntfAudience').value,action_link:(document.getElementById('ntfLink').value||'').trim()||null};
  var r=await sb.from('notifications').insert(obj);
  if(r.error){alert('Error: '+r.error.message);return;}
  try{await fetch('/api/send-push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title,body:body,type:obj.type||'general',url:obj.action_link||'/',audience:obj.audience||'all'})});}catch(e){console.warn('Push API not deployed yet',e);}
  document.getElementById('ntfTitle').value='';document.getElementById('ntfBody').value='';document.getElementById('ntfLink').value='';
  alert('✅ Notification sent to users');loadRecentNotifs();
}
async function loadRecentNotifs(){
  var tb=document.getElementById('ntfRecentBody');if(!tb||!sb)return;
  var r=await sb.from('notifications').select('*').eq('is_official',true).order('created_at',{ascending:false}).limit(30);
  if(r.error){tb.innerHTML='<tr><td colspan="4" style="text-align:center;padding:20px;color:#ef4444">'+aEsc(r.error.message)+'</td></tr>';return;}
  var data=r.data||[];if(!data.length){tb.innerHTML='<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted)">No notifications sent yet</td></tr>';return;}
  var albl={all:'📢 All',premium:'💎 Premium',free:'🆓 Free'};
  tb.innerHTML=data.map(function(n){return '<tr><td><strong>'+aEsc(n.title||'')+'</strong><div style="font-size:11px;color:#94a0b8">'+aEsc((n.body||'').slice(0,60))+'</div></td><td>'+(albl[n.audience]||'📢 All')+'</td><td>'+aEsc(n.type||'general')+'</td><td>'+new Date(n.created_at).toLocaleString()+'</td></tr>';}).join('');
}
// Auto-refresh support inbox while the Messages page is open (fallback)
setInterval(function(){if(document.hidden)return;var p=document.getElementById('page-messages');if(p&&p.classList.contains('active'))loadAdminMessages(true);},120000);
// Realtime for Support + Notifications is owned by realtime-complete.js V3.
// It connects only while the matching admin tab is active.

// ========== COMPANY REVENUE V85 ==========
const CR_INCOME_CATEGORIES = ['DPrime Commission','XM Commission','Exness Commission','Total Courses Revenue','Other Income'];
const CR_EXPENSE_CATEGORIES = ['Marketing','Salaries','Other Expenses'];
let crEntries = [], crPartners = [], crPeople = [];
let crEditingEntryId = null, crEditingPartnerId = null, crEditingPersonId = null;
let crEditingReceiptPath = null, crRevenueBooted = false, crActiveTab = 'overview';

function crEsc(value){return String(value == null ? '' : value).replace(/[&<>'"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch];});}
function crNum(value){var n=Number(value);return Number.isFinite(n)?n:0;}
function crMoney(value){return crNum(value).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
function crUsd(value){return '$'+crMoney(value);}
function crCurrencyMoney(value,currency){currency=String(currency||'USD').toUpperCase();return currency==='PKR'?'PKR '+crMoney(value):crUsd(value);}
function crSalaryCurrency(person){return String((person&&person.salary_currency)||'USD').toUpperCase()==='PKR'?'PKR':'USD';}
function crSalaryFx(person){var cur=crSalaryCurrency(person),fx=crNum(person&&person.salary_fx_rate);return cur==='PKR'?(fx>0?fx:0):1;}
function crSalaryUsd(person){var salary=crNum(person&&person.monthly_salary),cur=crSalaryCurrency(person),fx=crSalaryFx(person);return cur==='PKR'?(fx>0?salary/fx:0):salary;}
function crToday(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function crThisMonth(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
function crMonthStart(){var v=(document.getElementById('crMonth')||{}).value||'';return v?v+'-01':'';}
function crPeriodLabel(){var m=document.getElementById('crMonth');if(!m||!m.value)return'All time';var parts=m.value.split('-'),dt=new Date(Number(parts[0]),Number(parts[1])-1,1);return dt.toLocaleDateString(undefined,{month:'long',year:'numeric'});}
function crSetStatus(id,msg,isError){var el=document.getElementById(id);if(!el)return;el.textContent=msg||'';el.style.color=isError?'var(--red)':'var(--green)';}
function crIsCourseCategory(cat){return String(cat||'').toLowerCase().indexOf('total courses revenue')===0;}
function crCourseSharePercent(){return crPeople.filter(function(p){return p.active!==false&&p.share_type==='course_revenue';}).reduce(function(s,p){return s+crNum(p.share_percent);},0);}
function crStaffProfitSharePercent(){return crPeople.filter(function(p){return p.active!==false&&p.share_type==='company_profit';}).reduce(function(s,p){return s+crNum(p.share_percent);},0);}
function crPartnerSharePercent(exceptId){return crPartners.filter(function(p){return p.active!==false&&p.id!==exceptId;}).reduce(function(s,p){return s+crNum(p.share_percent);},0);}
function crSwitchTab(tab){crActiveTab=tab==='compensation'?'compensation':'overview';var a=document.getElementById('crTabOverview'),b=document.getElementById('crTabCompensation'),v1=document.getElementById('crViewOverview'),v2=document.getElementById('crViewCompensation');if(a)a.classList.toggle('active',crActiveTab==='overview');if(b)b.classList.toggle('active',crActiveTab==='compensation');if(v1)v1.style.display=crActiveTab==='overview'?'block':'none';if(v2)v2.style.display=crActiveTab==='compensation'?'block':'none';}
function crSyncCategories(selected){var typeEl=document.getElementById('crType'),catEl=document.getElementById('crCategory');if(!typeEl||!catEl)return;var list=typeEl.value==='expense'?CR_EXPENSE_CATEGORIES:CR_INCOME_CATEGORIES;catEl.innerHTML=list.map(function(x){return '<option value="'+crEsc(x)+'">'+crEsc(x)+'</option>';}).join('');if(selected){var found=list.find(function(x){return x===selected||(crIsCourseCategory(x)&&crIsCourseCategory(selected));});if(found)catEl.value=found;}}
function crSyncEntryFields(){var type=(document.getElementById('crType')||{}).value||'income',cat=(document.getElementById('crCategory')||{}).value||'',receipt=document.getElementById('crReceiptWrap'),label=document.getElementById('crAmountLabel'),helper=document.getElementById('crAmountHelper'),salaryWrap=document.getElementById('crSalaryPersonWrap'),salarySelect=document.getElementById('crSalaryPerson'),otherWrap=document.getElementById('crOtherDetailsWrap'),otherLabel=document.getElementById('crOtherDetailsLabel'),otherInput=document.getElementById('crOtherDetails'),isSalary=type==='expense'&&cat==='Salaries',isOther=cat==='Other Expenses'||cat==='Other Income';if(receipt)receipt.style.display=type==='expense'?'block':'none';if(label)label.textContent=(type==='income'&&crIsCourseCategory(cat))?'Gross Course Revenue (USD)':'Amount (USD)';if(helper)helper.textContent=(type==='income'&&crIsCourseCategory(cat))?(crMoney(crCourseSharePercent())+'% configured Course Revenue share will be deducted automatically.') : (isSalary?'Select whose salary this payment is for. Manual salary amounts here are entered in USD; fixed USD/PKR salaries remain available under Staff & Compensation.':'');if(salaryWrap)salaryWrap.style.display=isSalary?'block':'none';if(salarySelect){var keep=salarySelect.value||'';salarySelect.innerHTML='<option value="">Select staff member</option>'+crPeople.filter(function(p){return p.active!==false;}).map(function(p){return '<option value="'+crEsc(p.id)+'">'+crEsc(p.person_name)+'</option>';}).join('');if(keep&&crPeople.some(function(p){return String(p.id)===String(keep);}))salarySelect.value=keep;}if(otherWrap)otherWrap.style.display=isOther?'block':'none';if(otherLabel)otherLabel.textContent=cat==='Other Income'?'Other Income Details':'Other Expense Details';if(otherInput){otherInput.placeholder=cat==='Other Income'?'e.g. Sponsorship, rebate, miscellaneous income':'e.g. Office supplies, software subscription, transport';if(!isOther)otherInput.value='';}}
function crSyncSalaryCurrency(){var cur=(document.getElementById('crPersonSalaryCurrency')||{}).value||'USD',wrap=document.getElementById('crSalaryFxWrap'),fx=document.getElementById('crPersonSalaryFx');if(wrap)wrap.style.display=cur==='PKR'?'block':'none';if(fx&&cur==='USD')fx.value='1';}
function crSyncPersonShareFields(){var type=(document.getElementById('crPersonShareType')||{}).value||'none',pct=document.getElementById('crPersonSharePercent');if(pct){pct.disabled=type==='none';if(type==='none')pct.value='0';}}
function crSetCurrentMonth(){var el=document.getElementById('crMonth');if(el)el.value=crThisMonth();loadCompanyRevenue();}
function crSetAllTime(){var el=document.getElementById('crMonth');if(el)el.value='';loadCompanyRevenue();}
function crResetEntryForm(){crEditingEntryId=null;crEditingReceiptPath=null;var t=document.getElementById('crType');if(t)t.value='income';crSyncCategories();crSyncEntryFields();var a=document.getElementById('crAmount');if(a)a.value='';var d=document.getElementById('crEntryDate');if(d)d.value=crToday();var n=document.getElementById('crNote');if(n)n.value='';var sp=document.getElementById('crSalaryPerson');if(sp)sp.value='';var od=document.getElementById('crOtherDetails');if(od)od.value='';var f=document.getElementById('crReceiptFile');if(f)f.value='';var h=document.getElementById('crReceiptHelper');if(h)h.textContent='Upload JPG, PNG, WEBP or PDF up to 10 MB.';var b=document.getElementById('crSaveEntryBtn');if(b)b.textContent='+ Add Transaction';var c=document.getElementById('crCancelEditBtn');if(c)c.style.display='none';crSetStatus('crEntryStatus','',false);}
function crResetPartnerForm(){crEditingPartnerId=null;var n=document.getElementById('crPartnerName');if(n)n.value='';var p=document.getElementById('crPartnerPercent');if(p)p.value='';var b=document.getElementById('crSavePartnerBtn');if(b)b.textContent='+ Add Partner';var c=document.getElementById('crCancelPartnerBtn');if(c)c.style.display='none';crSetStatus('crPartnerStatus','',false);}
function crResetPersonForm(){crEditingPersonId=null;var n=document.getElementById('crPersonName');if(n)n.value='';var s=document.getElementById('crPersonSalary');if(s)s.value='';var cur=document.getElementById('crPersonSalaryCurrency');if(cur)cur.value='USD';var fx=document.getElementById('crPersonSalaryFx');if(fx)fx.value='1';var t=document.getElementById('crPersonShareType');if(t)t.value='none';var p=document.getElementById('crPersonSharePercent');if(p)p.value='0';crSyncSalaryCurrency();crSyncPersonShareFields();var b=document.getElementById('crSavePersonBtn');if(b)b.textContent='+ Add Person';var c=document.getElementById('crCancelPersonBtn');if(c)c.style.display='none';crSetStatus('crPersonStatus','',false);}
async function crUploadReceipt(file,prefix){if(!file)return null;if(file.size>10485760)throw new Error('Receipt file must be 10 MB or smaller.');var ok=['image/jpeg','image/png','image/webp','application/pdf'];if(ok.indexOf(file.type)<0)throw new Error('Receipt must be JPG, PNG, WEBP or PDF.');var uid=(typeof currentAdmin!=='undefined'&&currentAdmin&&currentAdmin.id)?currentAdmin.id:'admin',clean=(file.name||'receipt').replace(/[^a-zA-Z0-9._-]+/g,'-'),path=uid+'/'+(prefix||'expense')+'/'+Date.now()+'-'+clean;var r=await sb.storage.from('company-expense-receipts').upload(path,file,{upsert:false,contentType:file.type});if(r.error)throw r.error;return path;}
async function crOpenReceipt(path){if(!path)return;var pop=window.open('about:blank','_blank'),r=await sb.storage.from('company-expense-receipts').createSignedUrl(path,300);if(r.error){try{pop&&pop.close()}catch(_){ }alert('Could not open receipt: '+r.error.message);return;}if(pop){pop.opener=null;pop.location=r.data.signedUrl;}else location.href=r.data.signedUrl;}
async function crSaveEntry(){if(!sb)return crSetStatus('crEntryStatus','Database is not connected.',true);var type=document.getElementById('crType').value,category=document.getElementById('crCategory').value,inputAmount=Number(document.getElementById('crAmount').value),entryDate=document.getElementById('crEntryDate').value,note=(document.getElementById('crNote').value||'').trim(),salaryPersonId=(document.getElementById('crSalaryPerson')||{}).value||'',otherDetails=((document.getElementById('crOtherDetails')||{}).value||'').trim(),file=(document.getElementById('crReceiptFile').files||[])[0],isSalary=type==='expense'&&category==='Salaries',isOther=category==='Other Expenses'||category==='Other Income';if(!category||!Number.isFinite(inputAmount)||inputAmount<=0||!entryDate)return crSetStatus('crEntryStatus','Please enter category, valid amount and date.',true);if(isSalary&&!salaryPersonId)return crSetStatus('crEntryStatus','Please select whose salary this payment is for.',true);if(isOther&&!otherDetails)return crSetStatus('crEntryStatus','Please specify what this Other item is.',true);var selectedPerson=isSalary?crPeople.find(function(p){return String(p.id)===String(salaryPersonId);}):null;if(isSalary&&!selectedPerson)return crSetStatus('crEntryStatus','Selected staff member could not be found. Add the person under Staff & Compensation first.',true);if(isSalary){var base='Salary - '+selectedPerson.person_name;note=note?base+' — '+note:base;}else if(isOther){note=note?otherDetails+' — '+note:otherDetails;}var amount=inputAmount,gross=null,deduction=null;if(type==='income'&&crIsCourseCategory(category)){var pct=crCourseSharePercent();if(pct>100.000001)return crSetStatus('crEntryStatus','Course Revenue shares cannot exceed 100%.',true);gross=inputAmount;deduction=gross*(pct/100);amount=gross;}var receiptPath=crEditingReceiptPath||null;try{if(type==='expense'&&file)receiptPath=await crUploadReceipt(file,'expenses');}catch(e){return crSetStatus('crEntryStatus',e.message||String(e),true);}var payload={entry_type:type,category:category,amount:amount,gross_amount:gross,share_deduction_amount:deduction,entry_date:entryDate,note:note||null,receipt_path:type==='expense'?receiptPath:null,compensation_person_id:isSalary?salaryPersonId:null,updated_at:new Date().toISOString()};var res=crEditingEntryId?await sb.from('company_finance_entries').update(payload).eq('id',crEditingEntryId):await sb.from('company_finance_entries').insert(payload);if(res.error){console.error('Revenue save error',res.error);return crSetStatus('crEntryStatus',res.error.message||'Could not save transaction.',true);}var msg=crEditingEntryId?'Transaction updated.':'Transaction added.';crResetEntryForm();crSetStatus('crEntryStatus',msg,false);await loadCompanyRevenue();}
function crEditEntry(id){var row=crEntries.find(function(x){return x.id===id;});if(!row)return;crEditingEntryId=id;crEditingReceiptPath=row.receipt_path||null;document.getElementById('crType').value=row.entry_type;crSyncCategories(row.category);crSyncEntryFields();document.getElementById('crAmount').value=crIsCourseCategory(row.category)?crNum(row.gross_amount||row.amount):row.amount;document.getElementById('crEntryDate').value=row.entry_date;var note=row.note||'',salarySelect=document.getElementById('crSalaryPerson'),otherInput=document.getElementById('crOtherDetails'),isSalary=row.entry_type==='expense'&&row.category==='Salaries',isOther=row.category==='Other Expenses'||row.category==='Other Income';if(isSalary&&salarySelect&&row.compensation_person_id)salarySelect.value=row.compensation_person_id;if(isOther&&otherInput){var parts=note.split(' — ');otherInput.value=parts.shift()||'';document.getElementById('crNote').value=parts.join(' — ');}else if(isSalary){var salaryPrefix='';if(row.compensation_person_id){var person=crPeople.find(function(p){return String(p.id)===String(row.compensation_person_id);});if(person)salaryPrefix='Salary - '+person.person_name;}document.getElementById('crNote').value=salaryPrefix&&note.indexOf(salaryPrefix)===0?note.slice(salaryPrefix.length).replace(/^\s*—\s*/,''):note;}else document.getElementById('crNote').value=note;if(row.receipt_path){document.getElementById('crReceiptHelper').innerHTML='Existing receipt attached. <button type="button" class="action-btn" onclick="crOpenReceipt(\''+crEsc(row.receipt_path)+'\')">View</button> Select a new file only to replace it.';}document.getElementById('crSaveEntryBtn').textContent='Save Changes';document.getElementById('crCancelEditBtn').style.display='inline-flex';document.getElementById('page-revenue').scrollIntoView({behavior:'smooth',block:'start'});}
async function crDeleteEntry(id){var ok=typeof window.pspConfirm==='function'?await window.pspConfirm('Delete this revenue transaction?'):confirm('Delete this revenue transaction?');if(!ok)return;var row=crEntries.find(function(x){return x.id===id;}),res=await sb.from('company_finance_entries').delete().eq('id',id);if(res.error){alert(res.error.message||'Could not delete transaction.');return;}if(row&&row.receipt_path)sb.storage.from('company-expense-receipts').remove([row.receipt_path]).catch(function(){});if(crEditingEntryId===id)crResetEntryForm();await loadCompanyRevenue();}
async function crSavePartner(){if(!sb)return crSetStatus('crPartnerStatus','Database is not connected.',true);var name=(document.getElementById('crPartnerName').value||'').trim(),percent=Number(document.getElementById('crPartnerPercent').value);if(!name||!Number.isFinite(percent)||percent<0||percent>100)return crSetStatus('crPartnerStatus','Enter a partner name and share between 0% and 100%.',true);var total=crPartnerSharePercent(crEditingPartnerId)+crStaffProfitSharePercent()+percent;if(total>100.000001)return crSetStatus('crPartnerStatus','Combined company profit shares cannot exceed 100%.',true);var payload={partner_name:name,share_percent:percent,active:true,updated_at:new Date().toISOString()},res=crEditingPartnerId?await sb.from('company_profit_partners').update(payload).eq('id',crEditingPartnerId):await sb.from('company_profit_partners').insert(payload);if(res.error)return crSetStatus('crPartnerStatus',res.error.message||'Could not save partner.',true);var msg=crEditingPartnerId?'Partner share updated.':'Partner added.';crResetPartnerForm();crSetStatus('crPartnerStatus',msg,false);await loadCompanyRevenue();}
function crEditPartner(id){var row=crPartners.find(function(x){return x.id===id;});if(!row)return;crEditingPartnerId=id;document.getElementById('crPartnerName').value=row.partner_name||'';document.getElementById('crPartnerPercent').value=crNum(row.share_percent);document.getElementById('crSavePartnerBtn').textContent='Save Changes';document.getElementById('crCancelPartnerBtn').style.display='inline-flex';}
async function crDeletePartner(id){var ok=typeof window.pspConfirm==='function'?await window.pspConfirm('Delete this partner share?'):confirm('Delete this partner share?');if(!ok)return;var res=await sb.from('company_profit_partners').delete().eq('id',id);if(res.error){alert(res.error.message||'Could not delete partner.');return;}if(crEditingPartnerId===id)crResetPartnerForm();await loadCompanyRevenue();}
async function crSavePerson(){if(!sb)return crSetStatus('crPersonStatus','Database is not connected.',true);var name=(document.getElementById('crPersonName').value||'').trim(),salary=Number(document.getElementById('crPersonSalary').value||0),salaryCurrency=(document.getElementById('crPersonSalaryCurrency').value||'USD').toUpperCase(),salaryFx=salaryCurrency==='PKR'?Number(document.getElementById('crPersonSalaryFx').value||0):1,shareType=document.getElementById('crPersonShareType').value,percent=shareType==='none'?0:Number(document.getElementById('crPersonSharePercent').value||0);if(!name||!Number.isFinite(salary)||salary<0||['USD','PKR'].indexOf(salaryCurrency)<0||!Number.isFinite(salaryFx)||salaryFx<=0||!Number.isFinite(percent)||percent<0||percent>100)return crSetStatus('crPersonStatus','Enter a valid name, salary, salary currency/rate and share percentage.',true);var courseOther=crPeople.filter(function(p){return p.id!==crEditingPersonId&&p.active!==false&&p.share_type==='course_revenue';}).reduce(function(s,p){return s+crNum(p.share_percent);},0);if(shareType==='course_revenue'&&courseOther+percent>100.000001)return crSetStatus('crPersonStatus','Combined Course Revenue shares cannot exceed 100%.',true);var profitOther=crPeople.filter(function(p){return p.id!==crEditingPersonId&&p.active!==false&&p.share_type==='company_profit';}).reduce(function(s,p){return s+crNum(p.share_percent);},0)+crPartnerSharePercent();if(shareType==='company_profit'&&profitOther+percent>100.000001)return crSetStatus('crPersonStatus','Combined company profit shares cannot exceed 100%.',true);var payload={person_name:name,monthly_salary:salary,salary_currency:salaryCurrency,salary_fx_rate:salaryFx,share_type:shareType,share_percent:percent,active:true,updated_at:new Date().toISOString()},res=crEditingPersonId?await sb.from('company_compensation_people').update(payload).eq('id',crEditingPersonId):await sb.from('company_compensation_people').insert(payload);if(res.error)return crSetStatus('crPersonStatus',res.error.message||'Could not save person.',true);var msg=crEditingPersonId?'Compensation updated.':'Person added.';crResetPersonForm();crSetStatus('crPersonStatus',msg,false);await loadCompanyRevenue();}
function crEditPerson(id){var row=crPeople.find(function(x){return x.id===id;});if(!row)return;crEditingPersonId=id;document.getElementById('crPersonName').value=row.person_name||'';document.getElementById('crPersonSalary').value=crNum(row.monthly_salary);document.getElementById('crPersonSalaryCurrency').value=crSalaryCurrency(row);document.getElementById('crPersonSalaryFx').value=crSalaryCurrency(row)==='PKR'?crNum(row.salary_fx_rate):1;document.getElementById('crPersonShareType').value=row.share_type||'none';document.getElementById('crPersonSharePercent').value=crNum(row.share_percent);crSyncSalaryCurrency();crSyncPersonShareFields();document.getElementById('crSavePersonBtn').textContent='Save Changes';document.getElementById('crCancelPersonBtn').style.display='inline-flex';}
async function crDeletePerson(id){var ok=typeof window.pspConfirm==='function'?await window.pspConfirm('Remove this person from compensation settings? Existing salary ledger records will remain.'):confirm('Remove this person from compensation settings?');if(!ok)return;var res=await sb.from('company_compensation_people').update({active:false,updated_at:new Date().toISOString()}).eq('id',id);if(res.error){alert(res.error.message||'Could not remove person.');return;}if(crEditingPersonId===id)crResetPersonForm();await loadCompanyRevenue();}
function crBreakdown(rows,type){var map={};rows.filter(function(x){return x.entry_type===type;}).forEach(function(x){map[x.category]=(map[x.category]||0)+crNum(x.amount);});var order=type==='income'?CR_INCOME_CATEGORIES:CR_EXPENSE_CATEGORIES;var extra=Object.keys(map).filter(function(k){return !order.some(function(o){return o===k||(crIsCourseCategory(o)&&crIsCourseCategory(k));});});var cats=order.concat(extra),seen={};var html=cats.filter(function(cat){var key=crIsCourseCategory(cat)?Object.keys(map).find(crIsCourseCategory):cat;if(!key||seen[key]||!(map[key]>0))return false;seen[key]=true;return true;}).map(function(cat){var key=crIsCourseCategory(cat)?Object.keys(map).find(crIsCourseCategory):cat;return '<div class="cr-breakdown-row"><span>'+crEsc(crIsCourseCategory(key)?'Total Courses Revenue':key)+'</span><strong class="cr-amount '+(type==='income'?'cr-positive':'cr-negative')+'">'+crUsd(map[key])+'</strong></div>';}).join('');return html||'<div class="cr-empty">No '+type+' recorded for this period.</div>';}
function crCalc(){var incomeRows=crEntries.filter(function(x){return x.entry_type==='income';}),expenses=crEntries.filter(function(x){return x.entry_type==='expense';}).reduce(function(s,x){return s+crNum(x.amount);},0),grossCourse=incomeRows.filter(function(x){return crIsCourseCategory(x.category);}).reduce(function(s,x){return s+crNum(x.gross_amount!=null?x.gross_amount:x.amount);},0),courseDeduction=incomeRows.filter(function(x){return crIsCourseCategory(x.category);}).reduce(function(s,x){return s+crNum(x.share_deduction_amount);},0),otherIncome=incomeRows.filter(function(x){return !crIsCourseCategory(x.category);}).reduce(function(s,x){return s+crNum(x.amount);},0),income=grossCourse+otherIncome,companyIncome=Math.max(0,income-courseDeduction),net=companyIncome-expenses,distributable=Math.max(net,0),partnerPct=crPartnerSharePercent(),staffProfitPct=crStaffProfitSharePercent(),totalPct=partnerPct+staffProfitPct,allocation=distributable*(totalPct/100),retained=net-allocation;return{income:income,companyIncome:companyIncome,expenses:expenses,net:net,distributable:distributable,partnerPct:partnerPct,staffProfitPct:staffProfitPct,totalPct:totalPct,allocation:allocation,retained:retained,grossCourse:grossCourse,courseDeduction:courseDeduction};}
function crSalaryEntryFor(personId){var period=crMonthStart();if(!period)return null;return crEntries.find(function(x){return x.entry_type==='expense'&&x.category==='Salaries'&&x.compensation_person_id===personId&&x.period_month===period;})||null;}
async function crPostSalary(personId){var period=crMonthStart();if(!period){alert('Select a month first.');return;}var person=crPeople.find(function(x){return x.id===personId;});if(!person||crNum(person.monthly_salary)<=0)return;if(crSalaryEntryFor(personId)){alert('Salary is already posted for '+crPeriodLabel()+'.');return;}var cur=crSalaryCurrency(person),fx=crSalaryFx(person),usd=crSalaryUsd(person);if(cur==='PKR'&&fx<=0){alert('Set a valid PKR per 1 USD rate for '+person.person_name+' first.');return;}var note='Salary - '+person.person_name+(cur==='PKR'?(' ('+crCurrencyMoney(person.monthly_salary,'PKR')+' @ '+crMoney(fx)+' PKR/USD)'):'');var payload={entry_type:'expense',category:'Salaries',amount:usd,currency:'USD',original_amount:crNum(person.monthly_salary),original_currency:cur,fx_units_per_usd:cur==='PKR'?fx:1,entry_date:period,note:note,compensation_person_id:person.id,period_month:period,updated_at:new Date().toISOString()},r=await sb.from('company_finance_entries').insert(payload);if(r.error){alert('Could not post salary: '+r.error.message);return;}await loadCompanyRevenue();}
async function crPostAllSalaries(){var period=crMonthStart();if(!period){alert('Select a month first.');return;}var list=crPeople.filter(function(p){return p.active!==false&&crNum(p.monthly_salary)>0&&!crSalaryEntryFor(p.id);});if(!list.length){alert('All fixed salaries are already posted for this month.');return;}var invalid=list.find(function(p){return crSalaryCurrency(p)==='PKR'&&crSalaryFx(p)<=0;});if(invalid){alert('Set a valid PKR per 1 USD rate for '+invalid.person_name+' first.');return;}var payload=list.map(function(p){var cur=crSalaryCurrency(p),fx=crSalaryFx(p),usd=crSalaryUsd(p),note='Salary - '+p.person_name+(cur==='PKR'?(' ('+crCurrencyMoney(p.monthly_salary,'PKR')+' @ '+crMoney(fx)+' PKR/USD)'):'');return{entry_type:'expense',category:'Salaries',amount:usd,currency:'USD',original_amount:crNum(p.monthly_salary),original_currency:cur,fx_units_per_usd:cur==='PKR'?fx:1,entry_date:period,note:note,compensation_person_id:p.id,period_month:period,updated_at:new Date().toISOString()};}),r=await sb.from('company_finance_entries').insert(payload);if(r.error){alert('Could not post salaries: '+r.error.message);return;}await loadCompanyRevenue();}
function crPickSalarySlip(personId){var salary=crSalaryEntryFor(personId);if(!salary){alert('Post this salary first, then upload the payment slip.');return;}var input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp,application/pdf';input.onchange=async function(){var file=(input.files||[])[0];if(!file)return;try{var path=await crUploadReceipt(file,'salaries'),r=await sb.from('company_finance_entries').update({receipt_path:path,updated_at:new Date().toISOString()}).eq('id',salary.id);if(r.error)throw r.error;await loadCompanyRevenue();}catch(e){alert('Slip upload failed: '+(e.message||e));}};input.click();}
function crRenderCompensation(calc){var body=document.getElementById('crCompBody'),month=crMonthStart(),fixedTotal=crPeople.filter(function(p){return p.active!==false;}).reduce(function(s,p){return s+crSalaryUsd(p);},0);document.getElementById('crGrossCourseTotal').textContent=crUsd(calc.grossCourse);document.getElementById('crCourseShareTotal').textContent=crUsd(calc.courseDeduction);document.getElementById('crFixedSalaryTotal').textContent=crUsd(month?fixedTotal:0);document.getElementById('crCompPeriodMeta').textContent=month?crPeriodLabel()+' fixed salaries · company accounts in USD':'Select a month to post fixed salaries.';if(!crPeople.length){body.innerHTML='<tr><td colspan="8" class="cr-empty">No staff configured yet.</td></tr>';return;}body.innerHTML=crPeople.map(function(p){var salaryOriginal=month?crNum(p.monthly_salary):0,cur=crSalaryCurrency(p),fx=crSalaryFx(p),salaryUsd=month?crSalaryUsd(p):0,shareType=p.share_type||'none',share=shareType==='course_revenue'?calc.grossCourse*(crNum(p.share_percent)/100):(shareType==='company_profit'?calc.distributable*(crNum(p.share_percent)/100):0),salaryRow=crSalaryEntryFor(p.id);if(salaryRow){salaryUsd=crNum(salaryRow.amount);salaryOriginal=crNum(salaryRow.original_amount!=null?salaryRow.original_amount:p.monthly_salary);cur=String(salaryRow.original_currency||cur).toUpperCase();fx=crNum(salaryRow.fx_units_per_usd||fx);}var totalUsd=salaryUsd+share,shareLabel=shareType==='course_revenue'?'Course Revenue':(shareType==='company_profit'?'Company Profit':'No Share'),status=!month?'Select month':(salaryOriginal<=0?'No salary':(salaryRow?'Posted':'Not posted')),salaryDisplay=crCurrencyMoney(salaryOriginal,cur)+(cur==='PKR'&&salaryOriginal>0?'<div class="cr-helper">≈ '+crUsd(salaryUsd)+(fx>0?' · '+crMoney(fx)+' PKR/USD':'')+'</div>':''),slip=salaryRow&&salaryRow.receipt_path?'<button class="action-btn" onclick="crOpenReceipt(\''+crEsc(salaryRow.receipt_path)+'\')">View Slip</button>':'—',actions='<div class="cr-actions"><button class="action-btn" title="Edit" onclick="crEditPerson(\''+p.id+'\')">✏️</button><button class="action-btn delete" title="Remove" onclick="crDeletePerson(\''+p.id+'\')">🗑️</button>'+(month&&salaryOriginal>0&&!salaryRow?'<button class="action-btn" onclick="crPostSalary(\''+p.id+'\')">Post Salary</button>':'')+(month&&salaryRow?'<button class="action-btn" onclick="crPickSalarySlip(\''+p.id+'\')">Upload Slip</button>':'')+'</div>';return '<tr><td><strong>'+crEsc(p.person_name)+'</strong></td><td>'+salaryDisplay+'</td><td>'+crEsc(shareLabel)+'<div class="cr-helper">'+crMoney(p.share_percent)+'%</div></td><td>'+crUsd(share)+'</td><td><strong>'+crUsd(totalUsd)+'</strong>'+(cur==='PKR'&&salaryOriginal>0?'<div class="cr-helper">includes '+crCurrencyMoney(salaryOriginal,'PKR')+' salary</div>':'')+'</td><td>'+crEsc(status)+'</td><td>'+slip+'</td><td>'+actions+'</td></tr>';}).join('');}
function crRenderRevenue(){var calc=crCalc();document.getElementById('crTotalIncome').textContent=crUsd(calc.income);document.getElementById('crTotalExpenses').textContent=crUsd(calc.expenses);var netEl=document.getElementById('crNetProfit');netEl.textContent=crUsd(calc.net);netEl.style.color=calc.net<0?'var(--red)':'var(--text-primary)';document.getElementById('crCompanyRetained').textContent=crUsd(calc.retained);document.getElementById('crShareTotal').textContent=crMoney(calc.totalPct)+'%';document.getElementById('crPartnerAllocationInline').textContent=crUsd(calc.allocation);document.getElementById('crProfitShareMeta').textContent=calc.staffProfitPct>0?('Includes '+crMoney(calc.staffProfitPct)+'% staff Company Profit share from Staff & Compensation.'):'Partner allocation is calculated from net company profit.';document.getElementById('crIncomeMeta').textContent=crPeriodLabel();document.getElementById('crLedgerMeta').textContent=crPeriodLabel()+' transactions';document.getElementById('crIncomeBreakdown').innerHTML=crBreakdown(crEntries,'income');document.getElementById('crExpenseBreakdown').innerHTML=crBreakdown(crEntries,'expense');var pBody=document.getElementById('crPartnerBody');if(!crPartners.length)pBody.innerHTML='<tr><td colspan="4" class="cr-empty">No partners configured yet.</td></tr>';else pBody.innerHTML=crPartners.map(function(p){var share=calc.distributable*(crNum(p.share_percent)/100);return '<tr><td><strong>'+crEsc(p.partner_name)+'</strong></td><td>'+crMoney(p.share_percent)+'%</td><td><strong class="cr-amount">'+crUsd(share)+'</strong></td><td><div class="cr-actions"><button class="action-btn" title="Edit" onclick="crEditPartner(\''+p.id+'\')">✏️</button><button class="action-btn delete" title="Delete" onclick="crDeletePartner(\''+p.id+'\')">🗑️</button></div></td></tr>';}).join('');var lBody=document.getElementById('crLedgerBody');if(!crEntries.length)lBody.innerHTML='<tr><td colspan="7" class="cr-empty">No revenue records for this period.</td></tr>';else lBody.innerHTML=crEntries.map(function(r){var isIncome=r.entry_type==='income',course=isIncome&&crIsCourseCategory(r.category),note=crEsc(r.note||'—')+(course&&crNum(r.share_deduction_amount)>0?'<div class="cr-helper">Gross '+crUsd(r.gross_amount)+' · Share deducted '+crUsd(r.share_deduction_amount)+'</div>':''),receipt=r.receipt_path?'<button class="action-btn" onclick="crOpenReceipt(\''+crEsc(r.receipt_path)+'\')">View</button>':'—';return '<tr><td>'+crEsc(r.entry_date||'—')+'</td><td><span class="badge '+(isIncome?'active':'banned')+'">'+(isIncome?'Income':'Expense')+'</span></td><td><strong>'+crEsc(crIsCourseCategory(r.category)?'Total Courses Revenue':(r.category||'—'))+'</strong></td><td>'+note+'</td><td><strong class="cr-amount '+(isIncome?'cr-positive':'cr-negative')+'">'+(isIncome?'+':'-')+crUsd(r.amount)+'</strong></td><td>'+receipt+'</td><td><div class="cr-actions"><button class="action-btn" title="Edit" onclick="crEditEntry(\''+r.id+'\')">✏️</button><button class="action-btn delete" title="Delete" onclick="crDeleteEntry(\''+r.id+'\')">🗑️</button></div></td></tr>';}).join('');crRenderCompensation(calc);crSyncEntryFields();}
async function loadCompanyRevenue(){if(!sb)return;if(!crRevenueBooted){crRevenueBooted=true;var month=document.getElementById('crMonth');if(month&&!month.value)month.value=crThisMonth();crSyncCategories();crSyncEntryFields();crSyncPersonShareFields();crSyncSalaryCurrency();var d=document.getElementById('crEntryDate');if(d&&!d.value)d.value=crToday();}var body=document.getElementById('crLedgerBody');if(body)body.innerHTML='<tr><td colspan="7" class="cr-empty">Loading...</td></tr>';var query=sb.from('company_finance_entries').select('*').order('entry_date',{ascending:false}).order('created_at',{ascending:false}),monthVal=(document.getElementById('crMonth')||{}).value||'';if(monthVal){var parts=monthVal.split('-'),y=Number(parts[0]),m=Number(parts[1]),start=monthVal+'-01',next=new Date(y,m,1),end=next.getFullYear()+'-'+String(next.getMonth()+1).padStart(2,'0')+'-01';query=query.gte('entry_date',start).lt('entry_date',end);}var results=await Promise.all([query,sb.from('company_profit_partners').select('*').eq('active',true).order('created_at',{ascending:true}),sb.from('company_compensation_people').select('*').eq('active',true).order('created_at',{ascending:true})]);if(results[0].error){console.error('Company revenue load error',results[0].error);body.innerHTML='<tr><td colspan="7" class="cr-empty" style="color:var(--red)">'+crEsc(results[0].error.message||'Could not load revenue data.')+'</td></tr>';return;}if(results[1].error){crSetStatus('crPartnerStatus',results[1].error.message||'Could not load partner shares.',true);return;}if(results[2].error){crSetStatus('crPersonStatus',results[2].error.message||'Could not load compensation settings.',true);return;}crEntries=results[0].data||[];crPartners=results[1].data||[];crPeople=results[2].data||[];crRenderRevenue();crSwitchTab(crActiveTab);}

// ========== COMPANY REVENUE V88 — PREMIUM MONTHLY FINANCE OVERRIDES ==========
var crPayouts = [], crStaffPayouts = [], crClosures = [], crAuditRows = [], crTrendEntries = [];
var crTrendChartInstance = null, crSourceChartInstance = null;
crActiveTab = 'dashboard';

function crMonthValue(){ var el=document.getElementById('crMonth'); return (el&&el.value)||crThisMonth(); }
function crSelectedPeriod(){ return crMonthValue()+'-01'; }
function crMonthFromDate(v){ if(!v) return ''; return String(v).slice(0,7)+'-01'; }
function crDefaultEntryDate(){ var m=crMonthValue(), today=crToday(); return today.slice(0,7)===m?today:m+'-01'; }
function crSelectedMonthClosed(){ var pm=crSelectedPeriod(); return crClosures.some(function(x){return String(x.period_month)===pm;}); }
function crPaymentBadge(status){ status=String(status||'paid').toLowerCase(); return '<span class="cr-status-badge '+crEsc(status)+'">'+(status==='paid'?'✓ Paid':status==='partial'?'◐ Partial':'◷ Pending')+'</span>'; }
function crPayoutStatus(due,paid){ due=crNum(due);paid=crNum(paid); if(due<=0||paid>=due-.005)return 'paid'; if(paid>0)return 'partial'; return 'pending'; }
function crEntryPerson(row){ if(!row||!row.compensation_person_id)return null; return crPeople.find(function(p){return String(p.id)===String(row.compensation_person_id);})||null; }
function crStaffPayoutFor(personId){ return crStaffPayouts.find(function(x){return String(x.person_id)===String(personId);})||null; }
function crPartnerPayoutFor(partnerId){ return crPayouts.find(function(x){return String(x.partner_id)===String(partnerId);})||null; }
function crSalaryEntryDate(person){ var d=Math.min(28,Math.max(1,Number(person&&person.salary_due_day)||1)); return crMonthValue()+'-'+String(d).padStart(2,'0'); }
function crCalc(){
  var incomeRows=crEntries.filter(function(x){return x.entry_type==='income';}),expenses=crEntries.filter(function(x){return x.entry_type==='expense';}).reduce(function(s,x){return s+crNum(x.amount);},0),grossCourse=incomeRows.filter(function(x){return crIsCourseCategory(x.category);}).reduce(function(s,x){return s+crNum(x.gross_amount!=null?x.gross_amount:x.amount);},0),courseDeduction=incomeRows.filter(function(x){return crIsCourseCategory(x.category);}).reduce(function(s,x){return s+crNum(x.share_deduction_amount);},0),otherIncome=incomeRows.filter(function(x){return !crIsCourseCategory(x.category);}).reduce(function(s,x){return s+crNum(x.amount);},0),income=grossCourse+otherIncome,companyIncome=Math.max(0,income-courseDeduction),net=companyIncome-expenses,distributable=Math.max(net,0),partnerPct=crPartnerSharePercent(),staffProfitPct=crStaffProfitSharePercent(),totalPct=partnerPct+staffProfitPct,allocation;
  if(crSelectedMonthClosed()){allocation=crPayouts.reduce(function(s,x){return s+crNum(x.amount_due);},0)+crStaffPayouts.filter(function(x){return x.share_type==='company_profit';}).reduce(function(s,x){return s+crNum(x.amount_due);},0);}else allocation=distributable*(totalPct/100);
  return{income:income,companyIncome:companyIncome,expenses:expenses,net:net,distributable:distributable,partnerPct:partnerPct,staffProfitPct:staffProfitPct,totalPct:totalPct,allocation:allocation,retained:net-allocation,grossCourse:grossCourse,courseDeduction:courseDeduction};
}
function crShareDueForPerson(person,calc){ if(!person||person.active===false)return 0; var pct=crNum(person.share_percent); if(person.share_type==='course_revenue')return calc.grossCourse*(pct/100); if(person.share_type==='company_profit')return calc.distributable*(pct/100); return 0; }
function crPartnerDue(partner,calc){ var snap=crPartnerPayoutFor(partner.id); if(crSelectedMonthClosed()&&snap)return crNum(snap.amount_due); return calc.distributable*(crNum(partner.share_percent)/100); }
function crStaffShareDue(person,calc){ var snap=crStaffPayoutFor(person.id); if(crSelectedMonthClosed()&&snap)return crNum(snap.amount_due); return crShareDueForPerson(person,calc); }

function crSwitchTab(tab){
  var tabs=['dashboard','transactions','compensation','payouts','reports'];
  if(tabs.indexOf(tab)<0)tab='dashboard'; crActiveTab=tab;
  tabs.forEach(function(t){ var b=document.getElementById('crTab'+t.charAt(0).toUpperCase()+t.slice(1)),v=document.getElementById('crView'+t.charAt(0).toUpperCase()+t.slice(1)); if(b)b.classList.toggle('active',t===tab); if(v)v.style.display=t===tab?'block':'none'; });
  if(tab==='dashboard')setTimeout(crRenderCharts,0);
}

function crShiftMonth(delta){ var el=document.getElementById('crMonth'); if(!el)return; var p=crMonthValue().split('-'),d=new Date(Number(p[0]),Number(p[1])-1+delta,1); el.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); loadCompanyRevenue(); }
function crSetCurrentMonth(){ var el=document.getElementById('crMonth'); if(el)el.value=crThisMonth(); loadCompanyRevenue(); }
function crSetAllTime(){ crSetCurrentMonth(); }

function crSyncPaymentFields(){ var status=(document.getElementById('crPaymentStatus')||{}).value||'paid'; document.querySelectorAll('#page-revenue .cr-payment-field').forEach(function(el){el.style.display=status==='paid'?'block':'none';}); if(status==='paid'){var pd=document.getElementById('crPaymentDate');if(pd&&!pd.value)pd.value=(document.getElementById('crEntryDate')||{}).value||crDefaultEntryDate();} }

function crSyncEntryFields(){
  var type=(document.getElementById('crType')||{}).value||'income',cat=(document.getElementById('crCategory')||{}).value||'',receipt=document.getElementById('crReceiptWrap'),label=document.getElementById('crAmountLabel'),helper=document.getElementById('crAmountHelper'),salaryWrap=document.getElementById('crSalaryPersonWrap'),salarySelect=document.getElementById('crSalaryPerson'),otherWrap=document.getElementById('crOtherDetailsWrap'),otherLabel=document.getElementById('crOtherDetailsLabel'),otherInput=document.getElementById('crOtherDetails'),marketingWrap=document.getElementById('crMarketingSubWrap'),marketing=document.getElementById('crMarketingSub'),isSalary=type==='expense'&&cat==='Salaries',isMarketing=type==='expense'&&cat==='Marketing',isOther=cat==='Other Expenses'||cat==='Other Income'||(isMarketing&&marketing&&marketing.value==='Other Marketing');
  if(receipt)receipt.style.display=type==='expense'?'block':'none';
  if(label)label.textContent=(type==='income'&&crIsCourseCategory(cat))?'Gross Course Revenue (USD)':'Amount (USD)';
  if(helper)helper.textContent=(type==='income'&&crIsCourseCategory(cat))?(crMoney(crCourseSharePercent())+'% configured Course Revenue share will be deducted automatically.'):(isSalary?'Select whose salary this payment is for. Fixed salaries can also be posted from Staff & Compensation.':'');
  if(marketingWrap)marketingWrap.style.display=isMarketing?'block':'none';
  if(salaryWrap)salaryWrap.style.display=isSalary?'block':'none';
  if(salarySelect){var keep=salarySelect.value||'';salarySelect.innerHTML='<option value="">Select staff member</option>'+crPeople.filter(function(p){return p.active!==false;}).map(function(p){return '<option value="'+crEsc(p.id)+'">'+crEsc(p.person_name)+'</option>';}).join('');if(keep&&crPeople.some(function(p){return String(p.id)===String(keep);}))salarySelect.value=keep;}
  if(otherWrap)otherWrap.style.display=isOther?'block':'none';
  if(otherLabel)otherLabel.textContent=cat==='Other Income'?'Other Income Details':(isMarketing?'Other Marketing Details':'Other Expense Details');
  if(otherInput){otherInput.placeholder=cat==='Other Income'?'e.g. Sponsorship, rebate, miscellaneous income':(isMarketing?'e.g. Event sponsorship, creator fee':'e.g. Office supplies, software subscription, transport');if(!isOther)otherInput.value='';}
  var ps=document.getElementById('crPaymentStatus'); if(ps&&!crEditingEntryId)ps.value=type==='expense'?'pending':'paid';
  crSyncPaymentFields();
}

function crResetEntryForm(){
  crEditingEntryId=null;crEditingReceiptPath=null;
  var t=document.getElementById('crType');if(t)t.value='income';crSyncCategories();
  var a=document.getElementById('crAmount');if(a)a.value='';var d=document.getElementById('crEntryDate');if(d)d.value=crDefaultEntryDate();
  ['crNote','crOtherDetails','crPaymentReference'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  var sp=document.getElementById('crSalaryPerson');if(sp)sp.value='';var ms=document.getElementById('crMarketingSub');if(ms)ms.selectedIndex=0;
  var st=document.getElementById('crPaymentStatus');if(st)st.value='paid';var pm=document.getElementById('crPaymentMethod');if(pm)pm.value='';var pd=document.getElementById('crPaymentDate');if(pd)pd.value='';
  var f=document.getElementById('crReceiptFile');if(f)f.value='';var h=document.getElementById('crReceiptHelper');if(h)h.textContent='Upload JPG, PNG, WEBP or PDF up to 10 MB.';
  var b=document.getElementById('crSaveEntryBtn');if(b)b.textContent='+ Add Transaction';var c=document.getElementById('crCancelEditBtn');if(c)c.style.display='none';
  crSyncEntryFields();crSetStatus('crEntryStatus','',false);
}

function crResetPersonForm(){
  crEditingPersonId=null;var n=document.getElementById('crPersonName');if(n)n.value='';var s=document.getElementById('crPersonSalary');if(s)s.value='';var cur=document.getElementById('crPersonSalaryCurrency');if(cur)cur.value='USD';var fx=document.getElementById('crPersonSalaryFx');if(fx)fx.value='1';var t=document.getElementById('crPersonShareType');if(t)t.value='none';var p=document.getElementById('crPersonSharePercent');if(p)p.value='0';var rec=document.getElementById('crRecurringSalary');if(rec)rec.value='true';var due=document.getElementById('crSalaryDueDay');if(due)due.value='1';crSyncSalaryCurrency();crSyncPersonShareFields();var b=document.getElementById('crSavePersonBtn');if(b)b.textContent='+ Add Person';var c=document.getElementById('crCancelPersonBtn');if(c)c.style.display='none';crSetStatus('crPersonStatus','',false);
}

async function crOpenReceipt(path){
  if(!path)return;var r=await sb.storage.from('company-expense-receipts').createSignedUrl(path,600);if(r.error){alert('Could not open receipt: '+r.error.message);return;}
  var url=r.data.signedUrl,preview=document.getElementById('crReceiptPreview'),dl=document.getElementById('crReceiptDownload'),modal=document.getElementById('crReceiptModal');if(dl)dl.href=url;
  var lower=String(path).toLowerCase();if(preview)preview.innerHTML=lower.endsWith('.pdf')?'<iframe src="'+crEsc(url)+'"></iframe>':'<img src="'+crEsc(url)+'" alt="Receipt preview">';if(modal)modal.classList.add('show');
}
function crCloseReceiptModal(){var m=document.getElementById('crReceiptModal'),p=document.getElementById('crReceiptPreview');if(m)m.classList.remove('show');if(p)p.innerHTML='';}

async function crSaveEntry(){
  if(!sb)return crSetStatus('crEntryStatus','Database is not connected.',true);if(crSelectedMonthClosed())return crSetStatus('crEntryStatus','This month is closed. Reopen it before changing transactions.',true);
  var type=document.getElementById('crType').value,category=document.getElementById('crCategory').value,inputAmount=Number(document.getElementById('crAmount').value),entryDate=document.getElementById('crEntryDate').value,note=(document.getElementById('crNote').value||'').trim(),salaryPersonId=(document.getElementById('crSalaryPerson')||{}).value||'',otherDetails=((document.getElementById('crOtherDetails')||{}).value||'').trim(),marketing=(document.getElementById('crMarketingSub')||{}).value||'',paymentStatus=(document.getElementById('crPaymentStatus')||{}).value||'paid',paymentMethod=((document.getElementById('crPaymentMethod')||{}).value||'').trim(),paymentDate=((document.getElementById('crPaymentDate')||{}).value||''),paymentReference=((document.getElementById('crPaymentReference')||{}).value||'').trim(),file=(document.getElementById('crReceiptFile').files||[])[0],isSalary=type==='expense'&&category==='Salaries',isMarketing=type==='expense'&&category==='Marketing',isOther=category==='Other Expenses'||category==='Other Income'||(isMarketing&&marketing==='Other Marketing');
  if(!category||!Number.isFinite(inputAmount)||inputAmount<=0||!entryDate)return crSetStatus('crEntryStatus','Please enter category, valid amount and date.',true);if(crMonthFromDate(entryDate)!==crSelectedPeriod())return crSetStatus('crEntryStatus','Transaction date must be inside the selected accounting month.',true);if(isSalary&&!salaryPersonId)return crSetStatus('crEntryStatus','Please select whose salary this payment is for.',true);if(isOther&&!otherDetails)return crSetStatus('crEntryStatus','Please specify the custom item.',true);
  var selectedPerson=isSalary?crPeople.find(function(p){return String(p.id)===String(salaryPersonId);}):null;if(isSalary&&!selectedPerson)return crSetStatus('crEntryStatus','Selected staff member could not be found.',true);
  var subcategory=isSalary?(selectedPerson?selectedPerson.person_name:''):(isMarketing?(marketing==='Other Marketing'?otherDetails:marketing):((category==='Other Expenses'||category==='Other Income')?otherDetails:null));
  if(isSalary){var base='Salary - '+selectedPerson.person_name;note=note?base+' — '+note:base;}else if((category==='Other Expenses'||category==='Other Income')&&otherDetails){note=note?otherDetails+' — '+note:otherDetails;}else if(isMarketing&&subcategory){note=note?subcategory+' — '+note:subcategory;}
  var duplicate=crEntries.find(function(x){return x.id!==crEditingEntryId&&x.entry_type===type&&String(x.category)===String(category)&&crNum(x.amount)===inputAmount&&String(x.entry_date)===entryDate&&String(x.compensation_person_id||'')===String(salaryPersonId||'')&&String(x.subcategory||'')===String(subcategory||'');});
  if(duplicate){var ok=typeof window.pspConfirm==='function'?await window.pspConfirm('Potential duplicate detected for the same date, category and amount. Save it anyway?'):confirm('Potential duplicate detected. Save anyway?');if(!ok)return;}
  var amount=inputAmount,gross=null,deduction=null;if(type==='income'&&crIsCourseCategory(category)){var pct=crCourseSharePercent();if(pct>100.000001)return crSetStatus('crEntryStatus','Course Revenue shares cannot exceed 100%.',true);gross=inputAmount;deduction=gross*(pct/100);amount=gross;}
  var receiptPath=crEditingReceiptPath||null;try{if(type==='expense'&&file)receiptPath=await crUploadReceipt(file,'expenses');}catch(e){return crSetStatus('crEntryStatus',e.message||String(e),true);}
  if(paymentStatus!=='paid'){paymentMethod=null;paymentDate=null;paymentReference=null;}else if(!paymentDate)paymentDate=entryDate;
  var payload={entry_type:type,category:category,subcategory:subcategory||null,amount:amount,gross_amount:gross,share_deduction_amount:deduction,entry_date:entryDate,period_month:crSelectedPeriod(),note:note||null,receipt_path:type==='expense'?receiptPath:null,compensation_person_id:isSalary?salaryPersonId:null,payment_status:paymentStatus,payment_method:paymentMethod||null,payment_date:paymentDate||null,payment_reference:paymentReference||null,updated_at:new Date().toISOString()};
  var res=crEditingEntryId?await sb.from('company_finance_entries').update(payload).eq('id',crEditingEntryId):await sb.from('company_finance_entries').insert(payload);if(res.error){console.error('Revenue save error',res.error);return crSetStatus('crEntryStatus',res.error.message||'Could not save transaction.',true);}var msg=crEditingEntryId?'Transaction updated.':'Transaction added.';crResetEntryForm();crSetStatus('crEntryStatus',msg,false);await loadCompanyRevenue();
}

function crEditEntry(id){
  if(crSelectedMonthClosed()){alert('This month is closed. Reopen it before editing transactions.');return;}var row=crEntries.find(function(x){return x.id===id;});if(!row)return;crEditingEntryId=id;crEditingReceiptPath=row.receipt_path||null;document.getElementById('crType').value=row.entry_type;crSyncCategories(row.category);document.getElementById('crAmount').value=crIsCourseCategory(row.category)?crNum(row.gross_amount||row.amount):row.amount;document.getElementById('crEntryDate').value=row.entry_date;
  var note=row.note||'',isSalary=row.entry_type==='expense'&&row.category==='Salaries',isMarketing=row.entry_type==='expense'&&row.category==='Marketing',isOther=row.category==='Other Expenses'||row.category==='Other Income';
  crSyncEntryFields();var salarySelect=document.getElementById('crSalaryPerson');if(isSalary&&salarySelect&&row.compensation_person_id)salarySelect.value=row.compensation_person_id;
  if(isMarketing){var options=Array.from(document.getElementById('crMarketingSub').options).map(function(o){return o.value;});if(row.subcategory&&options.indexOf(row.subcategory)>=0)document.getElementById('crMarketingSub').value=row.subcategory;else{document.getElementById('crMarketingSub').value='Other Marketing';document.getElementById('crOtherDetails').value=row.subcategory||'';}}
  if(isOther)document.getElementById('crOtherDetails').value=row.subcategory||note.split(' — ')[0]||'';
  if(isSalary){var person=crEntryPerson(row),prefix=person?'Salary - '+person.person_name:'';document.getElementById('crNote').value=prefix&&note.indexOf(prefix)===0?note.slice(prefix.length).replace(/^\s*—\s*/,''):note;}else if(isOther||isMarketing){var sub=row.subcategory||'';document.getElementById('crNote').value=sub&&note.indexOf(sub)===0?note.slice(sub.length).replace(/^\s*—\s*/,''):note;}else document.getElementById('crNote').value=note;
  document.getElementById('crPaymentStatus').value=row.payment_status||'paid';document.getElementById('crPaymentMethod').value=row.payment_method||'';document.getElementById('crPaymentDate').value=row.payment_date||'';document.getElementById('crPaymentReference').value=row.payment_reference||'';crSyncEntryFields();crSyncPaymentFields();
  if(row.receipt_path)document.getElementById('crReceiptHelper').innerHTML='Existing receipt attached. <button type="button" class="action-btn" onclick="crOpenReceipt(\''+crEsc(row.receipt_path)+'\')">Preview</button> Select a new file only to replace it.';document.getElementById('crSaveEntryBtn').textContent='Save Changes';document.getElementById('crCancelEditBtn').style.display='inline-flex';crSwitchTab('transactions');document.getElementById('crSaveEntryBtn').scrollIntoView({behavior:'smooth',block:'center'});
}

async function crDeleteEntry(id){ if(crSelectedMonthClosed()){alert('This month is closed. Reopen it before deleting transactions.');return;}var ok=typeof window.pspConfirm==='function'?await window.pspConfirm('Delete this company transaction?'):confirm('Delete this company transaction?');if(!ok)return;var row=crEntries.find(function(x){return x.id===id;}),res=await sb.from('company_finance_entries').delete().eq('id',id);if(res.error){alert(res.error.message||'Could not delete transaction.');return;}if(row&&row.receipt_path)sb.storage.from('company-expense-receipts').remove([row.receipt_path]).catch(function(){});if(crEditingEntryId===id)crResetEntryForm();await loadCompanyRevenue(); }

async function crSavePerson(){
  if(!sb)return crSetStatus('crPersonStatus','Database is not connected.',true);var name=(document.getElementById('crPersonName').value||'').trim(),salary=Number(document.getElementById('crPersonSalary').value||0),salaryCurrency=(document.getElementById('crPersonSalaryCurrency').value||'USD').toUpperCase(),salaryFx=salaryCurrency==='PKR'?Number(document.getElementById('crPersonSalaryFx').value||0):1,shareType=document.getElementById('crPersonShareType').value,percent=shareType==='none'?0:Number(document.getElementById('crPersonSharePercent').value||0),recurring=(document.getElementById('crRecurringSalary').value||'true')==='true',dueDay=Number(document.getElementById('crSalaryDueDay').value||1);
  if(!name||!Number.isFinite(salary)||salary<0||['USD','PKR'].indexOf(salaryCurrency)<0||!Number.isFinite(salaryFx)||salaryFx<=0||!Number.isFinite(percent)||percent<0||percent>100||!Number.isFinite(dueDay)||dueDay<1||dueDay>28)return crSetStatus('crPersonStatus','Enter a valid name, salary, currency/rate, share and due day.',true);
  var courseOther=crPeople.filter(function(p){return p.id!==crEditingPersonId&&p.active!==false&&p.share_type==='course_revenue';}).reduce(function(s,p){return s+crNum(p.share_percent);},0);if(shareType==='course_revenue'&&courseOther+percent>100.000001)return crSetStatus('crPersonStatus','Combined Course Revenue shares cannot exceed 100%.',true);var profitOther=crPeople.filter(function(p){return p.id!==crEditingPersonId&&p.active!==false&&p.share_type==='company_profit';}).reduce(function(s,p){return s+crNum(p.share_percent);},0)+crPartnerSharePercent();if(shareType==='company_profit'&&profitOther+percent>100.000001)return crSetStatus('crPersonStatus','Combined company profit shares cannot exceed 100%.',true);
  var payload={person_name:name,monthly_salary:salary,salary_currency:salaryCurrency,salary_fx_rate:salaryFx,share_type:shareType,share_percent:percent,recurring_salary:recurring,salary_due_day:dueDay,active:true,updated_at:new Date().toISOString()},res=crEditingPersonId?await sb.from('company_compensation_people').update(payload).eq('id',crEditingPersonId):await sb.from('company_compensation_people').insert(payload);if(res.error)return crSetStatus('crPersonStatus',res.error.message||'Could not save person.',true);var msg=crEditingPersonId?'Compensation updated.':'Person added.';crResetPersonForm();crSetStatus('crPersonStatus',msg,false);await loadCompanyRevenue();
}
function crEditPerson(id){var row=crPeople.find(function(x){return x.id===id;});if(!row)return;crEditingPersonId=id;document.getElementById('crPersonName').value=row.person_name||'';document.getElementById('crPersonSalary').value=crNum(row.monthly_salary);document.getElementById('crPersonSalaryCurrency').value=crSalaryCurrency(row);document.getElementById('crPersonSalaryFx').value=crSalaryCurrency(row)==='PKR'?crNum(row.salary_fx_rate):1;document.getElementById('crPersonShareType').value=row.share_type||'none';document.getElementById('crPersonSharePercent').value=crNum(row.share_percent);document.getElementById('crRecurringSalary').value=row.recurring_salary===false?'false':'true';document.getElementById('crSalaryDueDay').value=Number(row.salary_due_day)||1;crSyncSalaryCurrency();crSyncPersonShareFields();document.getElementById('crSavePersonBtn').textContent='Save Changes';document.getElementById('crCancelPersonBtn').style.display='inline-flex';}

async function crPostSalary(personId){
  if(crSelectedMonthClosed()){alert('This month is closed. Reopen it before posting salary.');return;}var person=crPeople.find(function(x){return x.id===personId;});if(!person||crNum(person.monthly_salary)<=0)return;if(crSalaryEntryFor(personId)){alert('Salary is already posted for '+crPeriodLabel()+'.');return;}var cur=crSalaryCurrency(person),fx=crSalaryFx(person),usd=crSalaryUsd(person);if(cur==='PKR'&&fx<=0){alert('Set a valid PKR per 1 USD rate for '+person.person_name+' first.');return;}var note='Salary - '+person.person_name+(cur==='PKR'?(' ('+crCurrencyMoney(person.monthly_salary,'PKR')+' @ '+crMoney(fx)+' PKR/USD)'):'');var payload={entry_type:'expense',category:'Salaries',subcategory:person.person_name,amount:usd,currency:'USD',original_amount:crNum(person.monthly_salary),original_currency:cur,fx_units_per_usd:cur==='PKR'?fx:1,entry_date:crSalaryEntryDate(person),note:note,compensation_person_id:person.id,period_month:crSelectedPeriod(),payment_status:'pending',updated_at:new Date().toISOString()},r=await sb.from('company_finance_entries').insert(payload);if(r.error){alert('Could not post salary: '+r.error.message);return;}await loadCompanyRevenue();
}
async function crPostAllSalaries(){
  if(crSelectedMonthClosed()){alert('This month is closed. Reopen it before posting salaries.');return;}var list=crPeople.filter(function(p){return p.active!==false&&p.recurring_salary!==false&&crNum(p.monthly_salary)>0&&!crSalaryEntryFor(p.id);});if(!list.length){alert('All recurring fixed salaries are already posted for this month.');return;}var invalid=list.find(function(p){return crSalaryCurrency(p)==='PKR'&&crSalaryFx(p)<=0;});if(invalid){alert('Set a valid PKR per 1 USD rate for '+invalid.person_name+' first.');return;}var payload=list.map(function(p){var cur=crSalaryCurrency(p),fx=crSalaryFx(p),usd=crSalaryUsd(p),note='Salary - '+p.person_name+(cur==='PKR'?(' ('+crCurrencyMoney(p.monthly_salary,'PKR')+' @ '+crMoney(fx)+' PKR/USD)'):'');return{entry_type:'expense',category:'Salaries',subcategory:p.person_name,amount:usd,currency:'USD',original_amount:crNum(p.monthly_salary),original_currency:cur,fx_units_per_usd:cur==='PKR'?fx:1,entry_date:crSalaryEntryDate(p),note:note,compensation_person_id:p.id,period_month:crSelectedPeriod(),payment_status:'pending',updated_at:new Date().toISOString()};}),r=await sb.from('company_finance_entries').insert(payload);if(r.error){alert('Could not post salaries: '+r.error.message);return;}await loadCompanyRevenue();
}

function crPickSalarySlip(personId){var salary=crSalaryEntryFor(personId);if(!salary){alert('Post this salary first, then upload the payment slip.');return;}var input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp,application/pdf';input.onchange=async function(){var file=(input.files||[])[0];if(!file)return;try{var path=await crUploadReceipt(file,'salaries'),r=await sb.from('company_finance_entries').update({receipt_path:path,updated_at:new Date().toISOString()}).eq('id',salary.id);if(r.error)throw r.error;await loadCompanyRevenue();}catch(e){alert('Slip upload failed: '+(e.message||e));}};input.click();}

function crRenderCompensation(calc){
  var body=document.getElementById('crCompBody'),fixedPeople=crPeople.filter(function(p){return p.active!==false&&p.recurring_salary!==false&&crNum(p.monthly_salary)>0;}),fixedTotal=fixedPeople.reduce(function(s,p){return s+crSalaryUsd(p);},0),posted=fixedPeople.filter(function(p){return !!crSalaryEntryFor(p.id);}).length;
  document.getElementById('crGrossCourseTotal').textContent=crUsd(calc.grossCourse);document.getElementById('crCourseShareTotal').textContent=crUsd(calc.courseDeduction);document.getElementById('crFixedSalaryTotal').textContent=crUsd(fixedTotal);document.getElementById('crSalaryPostedCount').textContent=posted+' / '+fixedPeople.length;document.getElementById('crCompPeriodMeta').textContent=crPeriodLabel()+' recurring payroll · company accounts in USD';
  if(!crPeople.length){body.innerHTML='<tr><td colspan="9" class="cr-empty">No staff configured yet.</td></tr>';return;}
  body.innerHTML=crPeople.map(function(p){var salaryRow=crSalaryEntryFor(p.id),salaryOriginal=salaryRow?crNum(salaryRow.original_amount!=null?salaryRow.original_amount:p.monthly_salary):crNum(p.monthly_salary),cur=salaryRow?String(salaryRow.original_currency||crSalaryCurrency(p)).toUpperCase():crSalaryCurrency(p),fx=salaryRow?crNum(salaryRow.fx_units_per_usd||crSalaryFx(p)):crSalaryFx(p),salaryUsd=salaryRow?crNum(salaryRow.amount):crSalaryUsd(p),share=crStaffShareDue(p,calc),staffP=crStaffPayoutFor(p.id),sharePaid=staffP?crNum(staffP.amount_paid):0,totalUsd=salaryUsd+share,salaryDisplay=crCurrencyMoney(salaryOriginal,cur)+(cur==='PKR'&&salaryOriginal>0?'<div class="cr-helper">≈ '+crUsd(salaryUsd)+' · '+crMoney(fx)+' PKR/USD</div>':''),shareLabel=p.share_type==='course_revenue'?'Course Revenue':(p.share_type==='company_profit'?'Company Profit':'No Share'),salaryStatus=salaryRow?crPaymentBadge(salaryRow.payment_status||'pending'):(p.recurring_salary===false?'Manual':'Not posted'),slip=salaryRow&&salaryRow.receipt_path?'<button class="action-btn" onclick="crOpenReceipt(\''+crEsc(salaryRow.receipt_path)+'\')">Preview</button>':'—',actions='<div class="cr-actions"><button class="action-btn" onclick="crEditPerson(\''+p.id+'\')">✏️</button>'+(crNum(p.monthly_salary)>0&&!salaryRow&&!crSelectedMonthClosed()?'<button class="action-btn" onclick="crPostSalary(\''+p.id+'\')">Post Salary</button>':'')+(salaryRow?'<button class="action-btn" onclick="crEditEntry(\''+salaryRow.id+'\')">Payment</button>':'')+(salaryRow?'<button class="action-btn" onclick="crPickSalarySlip(\''+p.id+'\')">Slip</button>':'')+(share>0?'<button class="action-btn" onclick="crOpenPayout(\'staff\',\''+p.id+'\')">Pay Share</button>':'')+'</div>';return '<tr><td><strong>'+crEsc(p.person_name)+'</strong><div class="cr-helper">'+(p.recurring_salary===false?'Manual salary':'Recurring · due day '+(p.salary_due_day||1))+'</div></td><td>'+salaryDisplay+'</td><td>'+crEsc(shareLabel)+'<div class="cr-helper">'+crMoney(p.share_percent)+'%</div></td><td><strong>'+crUsd(share)+'</strong></td><td><strong>'+crUsd(totalUsd)+'</strong></td><td>'+salaryStatus+'</td><td>'+crUsd(sharePaid)+'</td><td>'+slip+'</td><td>'+actions+'</td></tr>';}).join('');
}

function crLedgerRowsFiltered(){
  var q=((document.getElementById('crLedgerSearch')||{}).value||'').trim().toLowerCase(),type=(document.getElementById('crFilterType')||{}).value||'',cat=(document.getElementById('crFilterCategory')||{}).value||'',status=(document.getElementById('crFilterStatus')||{}).value||'',staff=(document.getElementById('crFilterStaff')||{}).value||'',from=(document.getElementById('crFilterFrom')||{}).value||'',to=(document.getElementById('crFilterTo')||{}).value||'';
  return crEntries.filter(function(r){var person=crEntryPerson(r),hay=[r.category,r.subcategory,r.note,r.payment_method,r.payment_reference,person&&person.person_name].join(' ').toLowerCase(),date=String(r.entry_date||'');return(!q||hay.indexOf(q)>=0)&&(!type||r.entry_type===type)&&(!cat||r.category===cat)&&(!status||(r.payment_status||'paid')===status)&&(!staff||String(r.compensation_person_id||'')===staff)&&(!from||date>=from)&&(!to||date<=to);});
}
function crFilterLedger(){crRenderLedger(crLedgerRowsFiltered());}
function crRenderLedger(rows){
  var body=document.getElementById('crLedgerBody');if(!body)return;if(!rows.length){body.innerHTML='<tr><td colspan="9" class="cr-empty">No matching transactions for this month.</td></tr>';return;}
  body.innerHTML=rows.map(function(r){var isIncome=r.entry_type==='income',course=isIncome&&crIsCourseCategory(r.category),person=crEntryPerson(r),sub=r.subcategory?'<div class="cr-helper">'+crEsc(r.subcategory)+'</div>':'',detail=crEsc(r.note||'—')+(course&&crNum(r.share_deduction_amount)>0?'<div class="cr-helper">Gross '+crUsd(r.gross_amount)+' · share deducted '+crUsd(r.share_deduction_amount)+'</div>':'')+(person?'<div class="cr-helper">Staff: '+crEsc(person.person_name)+'</div>':''),payment=crPaymentBadge(r.payment_status||'paid')+'<div class="cr-payment-meta">'+(r.payment_status==='paid'?('<strong>'+crEsc(r.payment_method||'Method not set')+'</strong><br>'+crEsc(r.payment_date||'')+(r.payment_reference?'<br>'+crEsc(r.payment_reference):'')):'Awaiting payment')+'</div>',receipt=r.receipt_path?'<button class="action-btn" onclick="crOpenReceipt(\''+crEsc(r.receipt_path)+'\')">Preview</button>':'—',actions='<div class="cr-actions"><button class="action-btn" title="Edit" onclick="crEditEntry(\''+r.id+'\')">✏️</button><button class="action-btn delete" title="Delete" onclick="crDeleteEntry(\''+r.id+'\')">🗑️</button></div>';return '<tr><td>'+crEsc(r.entry_date||'—')+'</td><td><span class="badge '+(isIncome?'active':'banned')+'">'+(isIncome?'Income':'Expense')+'</span></td><td><strong>'+crEsc(crIsCourseCategory(r.category)?'Total Courses Revenue':(r.category||'—'))+'</strong>'+sub+'</td><td>'+detail+'</td><td><strong class="cr-amount '+(isIncome?'cr-positive':'cr-negative')+'">'+(isIncome?'+':'-')+crUsd(r.amount)+'</strong></td><td>'+crPaymentBadge(r.payment_status||'paid')+'</td><td>'+payment.replace(crPaymentBadge(r.payment_status||'paid'),'')+'</td><td>'+receipt+'</td><td>'+actions+'</td></tr>';}).join('');
}

function crRenderFilterOptions(){
  var cat=document.getElementById('crFilterCategory'),staff=document.getElementById('crFilterStaff');if(cat){var keep=cat.value,cats=Array.from(new Set(crEntries.map(function(x){return x.category;}).filter(Boolean))).sort();cat.innerHTML='<option value="">All Categories</option>'+cats.map(function(x){return '<option value="'+crEsc(x)+'">'+crEsc(x)+'</option>';}).join('');if(cats.indexOf(keep)>=0)cat.value=keep;}if(staff){var keepS=staff.value;staff.innerHTML='<option value="">All Staff</option>'+crPeople.map(function(p){return '<option value="'+crEsc(p.id)+'">'+crEsc(p.person_name)+'</option>';}).join('');if(crPeople.some(function(p){return String(p.id)===String(keepS);}))staff.value=keepS;}
}

function crRenderPartnerPayouts(calc){
  var body=document.getElementById('crPartnerBody'),dueTotal=0,paidTotal=0,paidCount=0;if(!body)return;
  if(!crPartners.length){body.innerHTML='<tr><td colspan="9" class="cr-empty">No partners configured yet.</td></tr>';}else body.innerHTML=crPartners.map(function(p){var row=crPartnerPayoutFor(p.id),due=crPartnerDue(p,calc),paid=row?crNum(row.amount_paid):0,balance=Math.max(0,due-paid),status=crPayoutStatus(due,paid);dueTotal+=due;paidTotal+=paid;if(status==='paid'&&due>0)paidCount++;var payMeta=row&&row.payment_method?'<div class="cr-payment-meta"><strong>'+crEsc(row.payment_method)+'</strong><br>'+crEsc(row.payment_date||'')+(row.payment_reference?'<br>'+crEsc(row.payment_reference):'')+'</div>':'—',receipt=row&&row.receipt_path?'<button class="action-btn" onclick="crOpenReceipt(\''+crEsc(row.receipt_path)+'\')">Preview</button>':'—';return '<tr><td><strong>'+crEsc(p.partner_name)+'</strong></td><td>'+crMoney(p.share_percent)+'%</td><td><strong>'+crUsd(due)+'</strong></td><td>'+crUsd(paid)+'</td><td><strong class="'+(balance>0?'cr-negative':'cr-positive')+'">'+crUsd(balance)+'</strong></td><td>'+crPaymentBadge(status)+'</td><td>'+payMeta+'</td><td>'+receipt+'</td><td><div class="cr-actions"><button class="action-btn" onclick="crOpenPayout(\'partner\',\''+p.id+'\')">Payment</button><button class="action-btn" onclick="crEditPartner(\''+p.id+'\')">✏️</button><button class="action-btn delete" onclick="crDeletePartner(\''+p.id+'\')">🗑️</button></div></td></tr>';}).join('');
  document.getElementById('crPartnerDueTotal').textContent=crUsd(dueTotal);document.getElementById('crPartnerPaidTotal').textContent=crUsd(paidTotal);document.getElementById('crPartnerBalanceTotal').textContent=crUsd(Math.max(0,dueTotal-paidTotal));document.getElementById('crPartnerPaidCount').textContent=String(paidCount);document.getElementById('crPartnerAllocationPayout').textContent=crUsd(calc.distributable*(crPartnerSharePercent()/100));
}

function crOpenPayout(type,id){
  var calc=crCalc(),entity,row,due,name;if(type==='partner'){entity=crPartners.find(function(x){return String(x.id)===String(id);});row=crPartnerPayoutFor(id);due=entity?crPartnerDue(entity,calc):0;name=entity&&entity.partner_name;}else{entity=crPeople.find(function(x){return String(x.id)===String(id);});row=crStaffPayoutFor(id);due=entity?crStaffShareDue(entity,calc):0;name=entity&&entity.person_name;}
  if(!entity)return;document.getElementById('crPayoutType').value=type;document.getElementById('crPayoutId').value=id;document.getElementById('crPayoutTitle').textContent=(type==='partner'?'Partner Payout — ':'Staff Share Payout — ')+name;document.getElementById('crPayoutMeta').textContent=crPeriodLabel();document.getElementById('crPayoutDue').value=crNum(row&&row.amount_due)||due;document.getElementById('crPayoutPaid').value=crNum(row&&row.amount_paid);document.getElementById('crPayoutMethod').value=(row&&row.payment_method)||'';document.getElementById('crPayoutDate').value=(row&&row.payment_date)||crToday();document.getElementById('crPayoutReference').value=(row&&row.payment_reference)||'';document.getElementById('crPayoutNote').value=(row&&row.note)||'';document.getElementById('crPayoutReceipt').value='';crSetStatus('crPayoutStatus','',false);document.getElementById('crPayoutModal').classList.add('show');
}
function crClosePayoutModal(){var m=document.getElementById('crPayoutModal');if(m)m.classList.remove('show');}
async function crSavePayout(){
  var type=document.getElementById('crPayoutType').value,id=document.getElementById('crPayoutId').value,due=Number(document.getElementById('crPayoutDue').value||0),paid=Number(document.getElementById('crPayoutPaid').value||0),method=(document.getElementById('crPayoutMethod').value||'').trim(),date=document.getElementById('crPayoutDate').value,ref=(document.getElementById('crPayoutReference').value||'').trim(),note=(document.getElementById('crPayoutNote').value||'').trim(),file=(document.getElementById('crPayoutReceipt').files||[])[0];if(!Number.isFinite(paid)||paid<0||paid>due+.01)return crSetStatus('crPayoutStatus','Paid amount must be between $0 and the amount due.',true);var current=type==='partner'?crPartnerPayoutFor(id):crStaffPayoutFor(id),receipt=current&&current.receipt_path||null;try{if(file)receipt=await crUploadReceipt(file,type==='partner'?'partner-payouts':'staff-share-payouts');}catch(e){return crSetStatus('crPayoutStatus',e.message||String(e),true);}var payload={period_month:crSelectedPeriod(),amount_due:due,amount_paid:paid,payment_status:crPayoutStatus(due,paid),payment_method:paid>0?(method||null):null,payment_date:paid>0?(date||crToday()):null,payment_reference:paid>0?(ref||null):null,receipt_path:receipt,note:note||null,updated_at:new Date().toISOString()};if(type==='partner')payload.partner_id=id;else{payload.person_id=id;var staffPerson=crPeople.find(function(p){return String(p.id)===String(id);});payload.share_type=staffPerson&&staffPerson.share_type||'none';}var table=type==='partner'?'company_partner_payouts':'company_staff_share_payouts',conflict=type==='partner'?'partner_id,period_month':'person_id,period_month',r=await sb.from(table).upsert(payload,{onConflict:conflict});if(r.error)return crSetStatus('crPayoutStatus',r.error.message||'Could not save payout.',true);crClosePayoutModal();await loadCompanyRevenue();
}

async function crSyncPayoutDue(silent){
  if(!sb)return;if(crSelectedMonthClosed()){if(!silent)alert('This month is closed. Amounts due are already locked for this month.');return false;}var calc=crCalc(),pm=crSelectedPeriod(),partnerRows=crPartners.map(function(p){var existing=crPartnerPayoutFor(p.id);return{partner_id:p.id,period_month:pm,amount_due:calc.distributable*(crNum(p.share_percent)/100),amount_paid:crNum(existing&&existing.amount_paid),payment_status:crPayoutStatus(calc.distributable*(crNum(p.share_percent)/100),crNum(existing&&existing.amount_paid)),payment_method:existing&&existing.payment_method||null,payment_date:existing&&existing.payment_date||null,payment_reference:existing&&existing.payment_reference||null,receipt_path:existing&&existing.receipt_path||null,note:existing&&existing.note||null,updated_at:new Date().toISOString()};}),staffRows=crPeople.filter(function(p){return p.active!==false&&p.share_type!=='none'&&crNum(p.share_percent)>0;}).map(function(p){var existing=crStaffPayoutFor(p.id),due=crShareDueForPerson(p,calc);return{person_id:p.id,period_month:pm,share_type:p.share_type||'none',amount_due:due,amount_paid:crNum(existing&&existing.amount_paid),payment_status:crPayoutStatus(due,crNum(existing&&existing.amount_paid)),payment_method:existing&&existing.payment_method||null,payment_date:existing&&existing.payment_date||null,payment_reference:existing&&existing.payment_reference||null,receipt_path:existing&&existing.receipt_path||null,note:existing&&existing.note||null,updated_at:new Date().toISOString()};});
  if(partnerRows.length){var p=await sb.from('company_partner_payouts').upsert(partnerRows,{onConflict:'partner_id,period_month'});if(p.error){if(!silent)alert('Could not sync partner payouts: '+p.error.message);return false;}}
  if(staffRows.length){var s=await sb.from('company_staff_share_payouts').upsert(staffRows,{onConflict:'person_id,period_month'});if(s.error){if(!silent)alert('Could not sync staff share payouts: '+s.error.message);return false;}}
  if(!silent)await loadCompanyRevenue();return true;
}

async function crToggleMonthLock(){ if(crSelectedMonthClosed())return crReopenMonth();return crCloseMonth(); }
async function crCloseMonth(){
  var missing=crPeople.filter(function(p){return p.active!==false&&p.recurring_salary!==false&&crNum(p.monthly_salary)>0&&!crSalaryEntryFor(p.id);});if(missing.length){alert('Post all recurring salaries before closing this month. Pending: '+missing.map(function(p){return p.person_name;}).join(', '));return;}var pending=crEntries.filter(function(r){return r.entry_type==='expense'&&(r.payment_status||'paid')==='pending';});if(pending.length){alert('Settle or mark all expense/salary payments as Paid before closing the month. Pending items: '+pending.length);return;}
  var ok=typeof window.pspConfirm==='function'?await window.pspConfirm('Close '+crPeriodLabel()+'? Transactions and salary posting will be locked until you reopen the month.'):confirm('Close this month?');if(!ok)return;var synced=await crSyncPayoutDue(true);if(synced===false)return;var r=await sb.from('company_month_closures').insert({period_month:crSelectedPeriod(),note:'Month closed from Company Revenue dashboard'});if(r.error){alert(r.error.message||'Could not close month.');return;}await loadCompanyRevenue();
}
async function crReopenMonth(){var ok=typeof window.pspConfirm==='function'?await window.pspConfirm('Reopen '+crPeriodLabel()+' for editing?'):confirm('Reopen this month?');if(!ok)return;var r=await sb.from('company_month_closures').delete().eq('period_month',crSelectedPeriod());if(r.error){alert(r.error.message||'Could not reopen month.');return;}await loadCompanyRevenue();}
function crApplyMonthStatus(){var closed=crSelectedMonthClosed(),pill=document.getElementById('crMonthStatus'),btn=document.getElementById('crMonthLockBtn'),txt=document.getElementById('crMonthStatusText');document.body.classList.toggle('cr-month-closed',closed);if(pill){pill.textContent=closed?'CLOSED':'OPEN';pill.className='cr-month-pill '+(closed?'closed':'open');}if(btn){btn.textContent=closed?'🔓 Reopen Month':'🔒 Close Month';btn.className='btn btn-sm '+(closed?'btn-secondary':'');}if(txt)txt.textContent=closed?'Closed':'Open';var label=document.getElementById('crEntryMonthLabel');if(label)label.textContent=crPeriodLabel();}

function crRenderSajid(calc){var p=crPeople.find(function(x){return x.active!==false&&String(x.person_name||'').toLowerCase().indexOf('sajid')>=0;}),salary=0,share=0,paid=0,meta=document.getElementById('crSajidMeta');if(p){var row=crSalaryEntryFor(p.id),sp=crStaffPayoutFor(p.id);salary=row?crNum(row.amount):crSalaryUsd(p);share=crStaffShareDue(p,calc);paid=(row&&row.payment_status==='paid'?crNum(row.amount):0)+crNum(sp&&sp.amount_paid);if(meta)meta.textContent=p.person_name+' · '+(p.share_type==='course_revenue'?'Course Revenue share':p.share_type==='company_profit'?'Company Profit share':'No share configured')+' · '+crMoney(p.share_percent)+'%';}else if(meta)meta.textContent='Add “Sajid Bhai” under Staff & Compensation to activate this summary.';document.getElementById('crSajidSalary').textContent=crUsd(salary);document.getElementById('crSajidShare').textContent=crUsd(share);document.getElementById('crSajidTotal').textContent=crUsd(salary+share);document.getElementById('crSajidPaid').textContent=crUsd(paid);}

function crRenderReports(calc,pendingPayables){document.getElementById('crReportMonthTitle').textContent=crPeriodLabel();document.getElementById('crReportIncome').textContent=crUsd(calc.income);document.getElementById('crReportExpenses').textContent=crUsd(calc.expenses);document.getElementById('crReportProfit').textContent=crUsd(calc.net);document.getElementById('crReportAllocation').textContent=crUsd(calc.allocation);document.getElementById('crReportRetained').textContent=crUsd(calc.retained);document.getElementById('crReportOutstanding').textContent=crUsd(pendingPayables);var fx=crEntries.filter(function(r){return r.entry_type==='expense'&&r.category==='Salaries'&&String(r.original_currency||'').toUpperCase()==='PKR'&&crNum(r.fx_units_per_usd)>0;}),fb=document.getElementById('crFxBody');fb.innerHTML=fx.length?fx.map(function(r){var p=crEntryPerson(r);return '<tr><td>'+crEsc(r.entry_date)+'</td><td>'+crEsc(p?p.person_name:(r.subcategory||'—'))+'</td><td>PKR '+crMoney(r.original_amount)+'</td><td>'+crMoney(r.fx_units_per_usd)+'</td><td>'+crUsd(r.amount)+'</td></tr>';}).join(''):'<tr><td colspan="5" class="cr-empty">No PKR salary history this month.</td></tr>';var ab=document.getElementById('crAuditBody'),rows=crAuditRows.filter(function(a){return !a.period_month||String(a.period_month)===crSelectedPeriod();}).slice(0,50);ab.innerHTML=rows.length?rows.map(function(a){var d=new Date(a.created_at);return '<tr><td>'+crEsc(d.toLocaleString())+'</td><td>'+crEsc(a.action)+'</td><td>'+crEsc(String(a.entity_table||'').replace('company_','').replace(/_/g,' '))+'</td><td>'+crEsc((a.entity_id||'—').slice(0,18))+'</td></tr>';}).join(''):'<tr><td colspan="4" class="cr-empty">No audit records for this month.</td></tr>';}

function crRenderCharts(){
  if(typeof Chart==='undefined')return;var canvas=document.getElementById('crTrendChart'),src=document.getElementById('crSourceChart');if(!canvas||!src)return;if(crTrendChartInstance){crTrendChartInstance.destroy();crTrendChartInstance=null;}if(crSourceChartInstance){crSourceChartInstance.destroy();crSourceChartInstance=null;}
  var end=crMonthValue().split('-'),endDate=new Date(Number(end[0]),Number(end[1])-1,1),months=[];for(var i=11;i>=0;i--){var d=new Date(endDate.getFullYear(),endDate.getMonth()-i,1),key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01';months.push({key:key,label:d.toLocaleDateString(undefined,{month:'short',year:'2-digit'})});}
  var trend=months.map(function(m){var rows=crTrendEntries.filter(function(r){return String(r.period_month||crMonthFromDate(r.entry_date))===m.key;}),inc=rows.filter(function(r){return r.entry_type==='income';}).reduce(function(s,r){return s+crNum(r.amount);},0),courseShare=rows.filter(function(r){return r.entry_type==='income'&&crIsCourseCategory(r.category);}).reduce(function(s,r){return s+crNum(r.share_deduction_amount);},0),exp=rows.filter(function(r){return r.entry_type==='expense';}).reduce(function(s,r){return s+crNum(r.amount);},0);return{label:m.label,income:inc,expenses:exp,profit:inc-courseShare-exp};});
  crTrendChartInstance=new Chart(canvas,{type:'line',data:{labels:trend.map(function(x){return x.label;}),datasets:[{label:'Income',data:trend.map(function(x){return x.income;}),borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.08)',tension:.35,fill:false},{label:'Expenses',data:trend.map(function(x){return x.expenses;}),borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,.06)',tension:.35,fill:false},{label:'Net Profit',data:trend.map(function(x){return x.profit;}),borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,.07)',tension:.35,fill:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:9}}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': '+crUsd(ctx.raw);}}}},scales:{x:{ticks:{font:{size:8}},grid:{display:false}},y:{ticks:{font:{size:8},callback:function(v){return '$'+Number(v).toLocaleString();}},grid:{color:'rgba(148,163,184,.12)'}}}}});
  var map={};crEntries.filter(function(r){return r.entry_type==='income';}).forEach(function(r){var k=crIsCourseCategory(r.category)?'Courses':String(r.category||'Other').replace(' Commission','');map[k]=(map[k]||0)+crNum(r.amount);});var labels=Object.keys(map),values=labels.map(function(k){return map[k];});if(!labels.length){labels=['No income'];values=[1];}crSourceChartInstance=new Chart(src,{type:'doughnut',data:{labels:labels,datasets:[{data:values,backgroundColor:['#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#64748b'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:9}}},tooltip:{callbacks:{label:function(ctx){return labels[0]==='No income'?'No income recorded':ctx.label+': '+crUsd(ctx.raw);}}}}}});document.getElementById('crSourceChartMeta').textContent=crPeriodLabel()+' income sources';
}

function crRenderRevenue(){
  var calc=crCalc(),pendingExpenses=crEntries.filter(function(r){return r.entry_type==='expense'&&(r.payment_status||'paid')==='pending';}).reduce(function(s,r){return s+crNum(r.amount);},0),partnerOutstanding=crPartners.reduce(function(s,p){var due=crPartnerDue(p,calc),row=crPartnerPayoutFor(p.id);return s+Math.max(0,due-crNum(row&&row.amount_paid));},0),staffOutstanding=crPeople.filter(function(p){return p.share_type!=='none';}).reduce(function(s,p){var due=crStaffShareDue(p,calc),row=crStaffPayoutFor(p.id);return s+Math.max(0,due-crNum(row&&row.amount_paid));},0),pendingPayables=pendingExpenses+partnerOutstanding+staffOutstanding,paidExpenses=crEntries.filter(function(r){return r.entry_type==='expense'&&(r.payment_status||'paid')==='paid';}).reduce(function(s,r){return s+crNum(r.amount);},0);
  document.getElementById('crTotalIncome').textContent=crUsd(calc.income);document.getElementById('crTotalExpenses').textContent=crUsd(calc.expenses);document.getElementById('crNetProfit').textContent=crUsd(calc.net);document.getElementById('crCompanyRetained').textContent=crUsd(calc.retained);document.getElementById('crPendingPayables').textContent=crUsd(pendingPayables);document.getElementById('crIncomeMeta').textContent=crPeriodLabel();document.getElementById('crTxnCount').textContent=String(crEntries.length);document.getElementById('crPaidExpenseTotal').textContent=crUsd(paidExpenses);document.getElementById('crPendingExpenseTotal').textContent=crUsd(pendingExpenses);document.getElementById('crPartnerAllocationInline').textContent=crUsd(calc.allocation);document.getElementById('crCourseShareDashboard').textContent=crUsd(calc.courseDeduction);document.getElementById('crShareTotal').textContent=crMoney(calc.totalPct)+'%';document.getElementById('crProfitShareMeta').textContent=calc.staffProfitPct>0?('Includes '+crMoney(calc.staffProfitPct)+'% staff Company Profit share configured under Staff & Compensation.'):'Partner allocation is calculated from net company profit.';document.getElementById('crLedgerMeta').textContent=crPeriodLabel()+' transactions';
  document.getElementById('crIncomeBreakdown').innerHTML=crBreakdown(crEntries,'income');document.getElementById('crExpenseBreakdown').innerHTML=crBreakdown(crEntries,'expense');
  crRenderFilterOptions();crRenderLedger(crLedgerRowsFiltered());crRenderCompensation(calc);crRenderPartnerPayouts(calc);crRenderSajid(calc);crRenderReports(calc,pendingPayables);crApplyMonthStatus();crSyncEntryFields();setTimeout(crRenderCharts,0);
}

function crTrendStartDate(){var p=crMonthValue().split('-'),d=new Date(Number(p[0]),Number(p[1])-12,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01';}
function crTrendEndDate(){var p=crMonthValue().split('-'),d=new Date(Number(p[0]),Number(p[1]),1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01';}

async function loadCompanyRevenue(){
  if(!sb)return;if(!crRevenueBooted){crRevenueBooted=true;var month=document.getElementById('crMonth');if(month&&!month.value)month.value=crThisMonth();crSyncCategories();crSyncSalaryCurrency();crSyncPersonShareFields();crResetEntryForm();}
  var pm=crSelectedPeriod(),body=document.getElementById('crLedgerBody');if(body)body.innerHTML='<tr><td colspan="9" class="cr-empty">Loading...</td></tr>';
  var results=await Promise.all([
    sb.from('company_finance_entries').select('*').eq('period_month',pm).order('entry_date',{ascending:false}).order('created_at',{ascending:false}),
    sb.from('company_profit_partners').select('*').eq('active',true).order('created_at',{ascending:true}),
    sb.from('company_compensation_people').select('*').eq('active',true).order('created_at',{ascending:true}),
    sb.from('company_partner_payouts').select('*').eq('period_month',pm),
    sb.from('company_staff_share_payouts').select('*').eq('period_month',pm),
    sb.from('company_month_closures').select('*').eq('period_month',pm),
    sb.from('company_finance_audit_log').select('*').order('created_at',{ascending:false}).limit(120),
    sb.from('company_finance_entries').select('*').gte('period_month',crTrendStartDate()).lt('period_month',crTrendEndDate()).order('period_month',{ascending:true})
  ]);
  for(var i=0;i<results.length;i++){if(results[i].error){console.error('Company Revenue V88 load error',results[i].error);if(body)body.innerHTML='<tr><td colspan="9" class="cr-empty" style="color:var(--red)">'+crEsc(results[i].error.message||'Could not load company finance data.')+'</td></tr>';return;}}
  crEntries=results[0].data||[];crPartners=results[1].data||[];crPeople=results[2].data||[];crPayouts=results[3].data||[];crStaffPayouts=results[4].data||[];crClosures=results[5].data||[];crAuditRows=results[6].data||[];crTrendEntries=results[7].data||[];
  crRenderRevenue();crSwitchTab(crActiveTab);
}

function crCsvCell(v){var s=String(v==null?'':v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function crDownloadBlob(name,text,type){var blob=new Blob([text],{type:type||'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
function crExportCsv(){var calc=crCalc(),lines=[['PipSePaisa Company Finance Report',crPeriodLabel()],['Total Income',calc.income],['Total Expenses',calc.expenses],['Net Profit',calc.net],['Partner Allocation',calc.allocation],['Company Retained',calc.retained],[],['TRANSACTIONS'],['Date','Type','Category','Subcategory','Details','Amount USD','Status','Method','Payment Date','Reference']];crEntries.forEach(function(r){lines.push([r.entry_date,r.entry_type,r.category,r.subcategory||'',r.note||'',r.amount,r.payment_status||'paid',r.payment_method||'',r.payment_date||'',r.payment_reference||'']);});lines.push([],['PARTNER PAYOUTS'],['Partner','Share %','Due','Paid','Balance','Status']);crPartners.forEach(function(p){var row=crPartnerPayoutFor(p.id),due=crPartnerDue(p,calc),paid=crNum(row&&row.amount_paid);lines.push([p.partner_name,p.share_percent,due,paid,Math.max(0,due-paid),crPayoutStatus(due,paid)]);});crDownloadBlob('PipSePaisa-Company-Revenue-'+crMonthValue()+'.csv',lines.map(function(r){return r.map(crCsvCell).join(',');}).join('\n'),'text/csv;charset=utf-8');}
function crExportPdf(){var calc=crCalc(),w=window.open('','_blank');if(!w){alert('Please allow pop-ups to export the PDF report.');return;}var tx=crEntries.map(function(r){return '<tr><td>'+crEsc(r.entry_date)+'</td><td>'+crEsc(r.entry_type)+'</td><td>'+crEsc(r.category)+(r.subcategory?' — '+crEsc(r.subcategory):'')+'</td><td>'+crEsc(r.note||'')+'</td><td>$'+crMoney(r.amount)+'</td><td>'+crEsc(r.payment_status||'paid')+'</td></tr>';}).join(''),pp=crPartners.map(function(p){var row=crPartnerPayoutFor(p.id),due=crPartnerDue(p,calc),paid=crNum(row&&row.amount_paid);return '<tr><td>'+crEsc(p.partner_name)+'</td><td>'+crMoney(p.share_percent)+'%</td><td>$'+crMoney(due)+'</td><td>$'+crMoney(paid)+'</td><td>$'+crMoney(Math.max(0,due-paid))+'</td></tr>';}).join('');w.document.write('<!doctype html><html><head><title>PipSePaisa Company Revenue '+crEsc(crPeriodLabel())+'</title><style>body{font:12px Arial;color:#0f172a;padding:28px}h1{margin:0 0 4px}.sub{color:#64748b;margin-bottom:20px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:16px 0}.box{border:1px solid #e2e8f0;border-radius:8px;padding:10px}.box span{display:block;color:#64748b;font-size:9px;text-transform:uppercase}.box strong{font-size:16px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border-bottom:1px solid #e2e8f0;padding:7px;text-align:left}th{background:#0b1730;color:#fff;font-size:9px}h2{margin-top:24px}@media print{button{display:none}}</style></head><body><h1>PipSePaisa — Company Revenue</h1><div class="sub">'+crEsc(crPeriodLabel())+' · Generated '+new Date().toLocaleString()+'</div><div class="grid"><div class="box"><span>Income</span><strong>$'+crMoney(calc.income)+'</strong></div><div class="box"><span>Expenses</span><strong>$'+crMoney(calc.expenses)+'</strong></div><div class="box"><span>Net Profit</span><strong>$'+crMoney(calc.net)+'</strong></div><div class="box"><span>Allocation</span><strong>$'+crMoney(calc.allocation)+'</strong></div><div class="box"><span>Retained</span><strong>$'+crMoney(calc.retained)+'</strong></div></div><h2>Transactions</h2><table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Details</th><th>Amount</th><th>Status</th></tr></thead><tbody>'+tx+'</tbody></table><h2>Partner Payouts</h2><table><thead><tr><th>Partner</th><th>Share</th><th>Due</th><th>Paid</th><th>Balance</th></tr></thead><tbody>'+pp+'</tbody></table><script>window.onload=function(){window.print()}<\/script></body></html>');w.document.close();}


function showPage(page, el) {
  var oldPage=document.querySelector('.page.active');
  if(oldPage&&oldPage.id==='page-chats'&&page!=='chats')window.pspAdminChatRealtimeCleanup?.();
  if(oldPage&&oldPage.id==='page-messages'&&page!=='messages')++_msgLoadSeq;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  if (el) el.classList.add('active');
  
  const titles = {
    dashboard: ['Admin Command Center', 'Executive overview of users, payments, access, signals and growth'],
    revenue: ['Finance & Accounts', 'Income, expenses, salaries and profit in one place'],
    users: ['User Management', 'Manage all registered users'],
    trades: ['All Trades', 'Live feed of user trading activity'],
    subscriptions: ['Subscriptions', 'Manage premium memberships and pricing'],
    payments: ['Payment Methods', 'EasyPaisa, JazzCash, Bank, Crypto'],
    paymentreqs: ['Payments & Enrollments', 'Payments, course access and complete history'],
    courses: ['Courses Manager', 'Create and manage learning content'],
    news: ['News & Events', 'Manage economic calendar and news posts'],
    newshub: ['World News Hub', 'Live global news feed with forex impact analysis'],
    quiz: ['Quiz Manager', 'Manage daily quiz question bank'],
    adsignals: ['Official Signals', 'Post signals shown to all students'],
    adcharts: ['Official Charts', 'Post chart analysis shown to all students'],
    articles: ['Articles', 'Create and manage learning articles'],
    adbanners: ['Banners', 'Upload social media banners for users to download'],
    messages: ['Messages / Support', 'User support tickets and inbox'],
    notifications: ['Push Notifications', 'Send notifications to users'],
    emails: ['Email Campaigns', 'Send mass emails and newsletters'],
    settings: ['Platform Settings', 'Configure your platform'],
    sitetabs: ['Site Tabs', 'Turn user-website tabs ON / OFF for everyone'],
    mentoraccess: ['Mentor Access', 'Turn mentor panel tabs ON / OFF'],
    logs: ['Activity Logs', 'System and user activity history'],
    profile: ['Admin Profile', 'Your account settings']
  };
  const t = titles[page];
  if (t) {
    document.getElementById('pageTitle').textContent = t[0];
    document.getElementById('pageSubtitle').textContent = t[1];
  }
  document.getElementById('sidebar').classList.remove('open');
  window.scrollTo(0, 0);
  
  // Load real data for each page
  if (page === 'dashboard') loadDashboardStats();
  if (page === 'revenue') { if (typeof window.pspFinance179Load === 'function') window.pspFinance179Load(); }
  if (page === 'users') loadAdminUsers();
  if (page === 'trades') loadAdminTrades();
  if (page === 'courses') loadAdminCourses();
  if (page === 'news') loadAdminNewsPosts();
  if (page === 'quiz') loadAdminQuiz();
  if (page === 'adsignals') loadAdSignals();
  if (page === 'adcharts') loadAdCharts();
  if (page === 'articles') loadAdminArticles();
  if (page === 'adbanners'){loadAdBanners();loadLandingBrokers();loadLandingSocialLinks();}
  if (page === 'community') loadAdminCommunity();
  if (page === 'chats') renderAdminChats();
  if (page === 'messages') loadAdminMessages();
  if (page === 'notifications') loadRecentNotifs();
  if (page === 'payments') loadAdminPayments();
  if (page === 'paymentreqs') loadAdminPaymentReqs();
  if (page === 'subscriptions') loadAdminSubs();
  if (page === 'newshub' && window.anhInitLoad) window.anhInitLoad();
  if (page === 'sitetabs') loadSiteTabs();
  if (page === 'mentoraccess') loadMentorAccess();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
const SITE_TAB_DEFS=[
 ['performance','🏆 Performance'],['dashboard','📊 Dashboard'],['addtrade','➕ Add Trade'],['trades','📈 My Trades'],['analysis','📉 Trades Analysis'],
 ['aireport','🤖 AI Report'],['charts','📊 Live Charts'],['chats','💬 Member Chats'],
 ['signals','📶 Signals'],['articles','📝 Articles'],['vipplans','💎 VIP Plans'],
 ['news','📰 Economic News'],['newshub','📡 World News Hub'],['strength','💪 Currency Strength'],
 ['tools','🔧 Tools'],['eaindicator','🧩 EA & Indicator'],['learn','🎓 Learn Forex'],['vipindicators','⭐ VIP Indicators'],['vipea','🤖 VIP EAs'],
 ['banners','🖼️ Banners'],
 ['aitools','🤖 AI Tools'],['about','ℹ️ About'],['announce','📢 Announcements'],['support','💬 Support']
];

async function uploadLandingAsset(file,prefix){
  var ext=(file.name.split('.').pop()||'png').toLowerCase();
  var path='landing/'+prefix+'-'+Date.now()+'.'+ext;
  var up=await sb.storage.from('charts').upload(path,file,{upsert:true});
  if(up.error)throw up.error;
  return sb.storage.from('charts').getPublicUrl(path).data.publicUrl;
}
async function saveLandingBroker(){
  var name=(document.getElementById('lbName').value||'').trim();var link=(document.getElementById('lbLink').value||'').trim();
  var lf=document.getElementById('lbLight').files[0],df=document.getElementById('lbDark').files[0],msg=document.getElementById('lbMsg'),btn=document.getElementById('lbBtn');
  if(!name||!lf){msg.style.color='var(--red)';msg.textContent='Broker name and light banner are required.';return}
  btn.disabled=true;btn.textContent='Uploading…';
  try{var light=await uploadLandingAsset(lf,name+'-light');var dark=df?await uploadLandingAsset(df,name+'-dark'):light;
    await sb.from('banners').delete().eq('title','LANDING_BROKER|'+name);
    var ins=await sb.from('banners').insert({title:'LANDING_BROKER|'+name,description:JSON.stringify({link:link||'#',dark_url:dark}),image_url:light});if(ins.error)throw ins.error;
    msg.style.color='var(--green)';msg.textContent='✅ Broker card saved.';document.getElementById('lbName').value='';document.getElementById('lbLink').value='';document.getElementById('lbLight').value='';document.getElementById('lbDark').value='';loadLandingBrokers();
  }catch(e){msg.style.color='var(--red)';msg.textContent='Failed: '+(e.message||e)}finally{btn.disabled=false;btn.textContent='Save Broker Card'}
}
async function loadLandingBrokers(){
  var box=document.getElementById('lbList');if(!box)return;var r=await sb.from('banners').select('*').like('title','LANDING_BROKER|%').order('created_at');var rows=r.data||[];
  box.innerHTML=rows.length?rows.map(b=>{var n=(b.title||'').split('|').slice(1).join('|');return `<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden"><img src="${esc(b.image_url)}" style="width:100%;aspect-ratio:2/1;object-fit:cover"><div style="padding:10px;display:flex;justify-content:space-between;align-items:center"><b>${esc(n)}</b><button type="button" data-broker-id="${esc(b.id)}" class="landing-broker-delete" style="border:1px solid var(--red);background:transparent;color:var(--red);border-radius:7px;padding:5px 9px">Delete</button></div></div>`}).join(''):'<div style="color:var(--text-muted)">No landing brokers added yet.</div>';
  box.querySelectorAll('.landing-broker-delete').forEach(btn=>btn.addEventListener('click',()=>deleteLandingBroker(btn.dataset.brokerId)));
}
async function deleteLandingBroker(id){if(!(await window.pspConfirm('Delete this landing broker card?')))return;await sb.from('banners').delete().eq('id',id);loadLandingBrokers()}
async function saveLandingSocialLinks(){
  var vals={facebook:document.getElementById('lsFacebook').value.trim(),instagram:document.getElementById('lsInstagram').value.trim(),whatsapp:document.getElementById('lsWhatsapp').value.trim()};var msg=document.getElementById('lsMsg');
  try{for(const k of Object.keys(vals)){await sb.from('banners').delete().eq('title','LANDING_SOCIAL|'+k);if(vals[k]){var r=await sb.from('banners').insert({title:'LANDING_SOCIAL|'+k,description:vals[k],image_url:'social-link'});if(r.error)throw r.error}}msg.style.color='var(--green)';msg.textContent='✅ Social links saved.';}catch(e){msg.style.color='var(--red)';msg.textContent='Failed: '+(e.message||e)}
}
async function loadLandingSocialLinks(){var r=await sb.from('banners').select('title,description').like('title','LANDING_SOCIAL|%');(r.data||[]).forEach(x=>{var k=x.title.split('|')[1];var id=k==='facebook'?'lsFacebook':k==='instagram'?'lsInstagram':'lsWhatsapp';var el=document.getElementById(id);if(el)el.value=x.description||''})}

async function uploadBanner(){
  var f=document.getElementById('bnFile');var t=document.getElementById('bnTitle');var d=document.getElementById('bnDesc');var msg=document.getElementById('bnMsg');var btn=document.getElementById('bnBtn');
  var file=f&&f.files&&f.files[0];
  if(!file){msg.style.color='var(--red)';msg.textContent='Please choose an image first.';return;}
  btn.disabled=true;var old=btn.textContent;btn.textContent='⏳ Uploading...';msg.style.color='var(--text-muted)';msg.textContent='Uploading…';
  try{
    var ext=(file.name.split('.').pop()||'jpg').toLowerCase();
    var path='banners/'+Date.now()+'.'+ext;
    var up=await sb.storage.from('charts').upload(path,file,{upsert:true});
    if(up.error)throw up.error;
    var url=sb.storage.from('charts').getPublicUrl(path).data.publicUrl;
    var bannerObj={title:(t.value||'').trim()||null,description:(d&&d.value||'').trim()||null,image_url:url};
    var ins=await sb.from('banners').insert(bannerObj);
    if(ins.error)throw ins.error;
    await pspCreateNotificationAndPush('🖼️ New Banner Added', (bannerObj.title||'A new banner')+' is now available.', 'banner', '/?tab=tools&tool=banners', 'all');
    msg.style.color='var(--green)';msg.textContent='✅ Banner uploaded!';
    f.value='';t.value='';if(d)d.value='';
    loadAdBanners();
  }catch(e){msg.style.color='var(--red)';msg.textContent='Upload failed: '+(e.message||e);}
  finally{btn.disabled=false;btn.textContent=old;}
}
async function loadAdBanners(){
  var g=document.getElementById('adBannersGrid');if(!g)return;
  g.innerHTML='<div style="color:var(--text-muted);padding:20px;">Loading…</div>';
  try{
    var r=await sb.from('banners').select('*').order('created_at',{ascending:false});
    var rows=r.data||[];
    if(!rows.length){g.innerHTML='<div style="color:var(--text-muted);padding:20px;">No banners yet.</div>';return;}
    g.innerHTML=rows.map(function(b){
      return '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--bg-elevated);">'+
        '<img src="'+esc(b.image_url)+'" style="width:100%;display:block;object-fit:cover;background:#0a0e1a;">'+
        '<div style="padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;">'+
          '<div style="min-width:0;flex:1;"><div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(b.title||'Banner')+'</div>'+(b.description?'<div style="font-size:11px;color:var(--text-muted);margin-top:3px;line-height:1.35;">'+esc(b.description)+'</div>':'')+'</div>'+
          '<button onclick="deleteBanner(\''+b.id+'\')" style="flex:0 0 auto;padding:6px 12px;border:1px solid var(--red);border-radius:8px;background:transparent;color:var(--red);font-weight:700;font-size:12px;cursor:pointer;">Delete</button>'+
        '</div></div>';
    }).join('');
  }catch(e){g.innerHTML='<div style="color:var(--red);padding:20px;">'+esc(e.message||'Error')+'</div>';}
}
async function deleteBanner(id){
  if(!(await window.pspConfirm('Delete this banner?')))return;
  try{var r=await sb.from('banners').delete().eq('id',id);if(r.error)throw r.error;loadAdBanners();}
  catch(e){alert('Delete failed: '+(e.message||e));}
}
async function loadSiteTabs(){
  var box=document.getElementById('siteTabsList');if(!box)return;
  var enabledByKey={};
  try{var r=await sb.from('site_settings').select('key,enabled');if(r.error)throw r.error;(r.data||[]).forEach(function(s){enabledByKey[s.key]=s.enabled===true;});}catch(e){box.innerHTML='<div class="list-empty" style="color:var(--red)">'+esc(e.message||'Error')+'</div>';return;}
  box.innerHTML='<div style="display:grid;gap:8px">'+SITE_TAB_DEFS.map(function(t){
    var off=enabledByKey[t[0]]!==true;
    return '<div class="sigc" style="display:flex;justify-content:space-between;align-items:center;gap:10px"><strong>'+t[1]+'</strong><button class="btn" onclick="toggleSiteTab(\''+t[0]+'\','+off+')" style="padding:6px 18px;font-size:13px;border:none;border-radius:8px;cursor:pointer;font-weight:800;background:'+(off?'rgba(239,68,68,.18)':'linear-gradient(135deg,#10b981,#059669)')+';color:'+(off?'#ef4444':'#fff')+'">'+(off?'OFF':'ON')+'</button></div>';
  }).join('')+'</div>';
}
async function toggleSiteTab(key,enabled){
  var res=await sb.from('site_settings').upsert({key:key,enabled:enabled,updated_at:new Date().toISOString()},{onConflict:'key'});
  if(res.error){alert('Error: '+res.error.message);return;}
  loadSiteTabs();
}

const MENTOR_ACCESS_DEFS=[
 ['performance','🏆 Performance','Live overview and results'],
 ['signals','📊 Signals','Create and manage signals shown to all users'],
 ['charts','📈 Charts','Upload chart analysis shown to all users'],
 ['articles','📖 Articles','Create learning articles shown to all users'],
 ['banners','🖼️ Banners','Upload marketing banners shown to all users'],
 ['subscriptions','💳 Subscriptions','VIP plans and subscribers'],
 ['courses','🎓 Courses','Course content'],
 ['news','📰 News','News and events'],
 ['quiz','❓ Quiz','Quiz question bank'],
 ['community','👥 Community','Community groups'],
 ['analytics','📉 Analytics','Mentor analytics'],
 ['earnings','💰 Earnings','Commission and payouts'],
 ['students','👥 Students','Student list'],
 ['requests','🧾 Requests','Payment requests'],
 ['chats','✉️ Member Chats','Direct member chats'],
 ['messages','💬 Messages','Broadcast messages'],
 ['notifications','🔔 Notifications','Mentor notifications'],
 ['settings','👤 Profile','Profile and account verification']
];
const MENTOR_DEFAULT_ON={dashboard:true,signals:true,charts:true,articles:true,settings:true};
window.mentorAccessState = window.mentorAccessState || {};
function getMentorAccessState(settings){
  var state={};
  MENTOR_ACCESS_DEFS.forEach(function(t){
    var key=t[0];
    state[key]=(settings && key in settings)?(settings[key]!==false):(MENTOR_DEFAULT_ON[key]===true);
  });
  return state;
}
function renderMentorAccess(settings){
  var box=document.getElementById('mentorAccessList'); if(!box) return;
  window.mentorAccessState = getMentorAccessState(settings || window.mentorAccessState || {});
  box.innerHTML='<div style="display:grid;gap:8px">'+MENTOR_ACCESS_DEFS.map(function(t){
    var key=t[0]; var on=window.mentorAccessState[key]===true;
    return '<div class="sigc" style="display:flex;justify-content:space-between;align-items:center;gap:12px">'+
      '<div><strong>'+t[1]+'</strong><div style="font-size:11.5px;color:var(--text-muted);margin-top:3px">'+aEsc(t[2])+'</div></div>'+
      '<button type="button" class="btn mentor-access-btn" data-key="'+key+'" data-enabled="'+on+'" onclick="window.toggleMentorAccess(\''+key+'\','+(!on)+')" style="padding:6px 18px;font-size:13px;border:none;border-radius:8px;cursor:pointer;font-weight:800;background:'+(on?'linear-gradient(135deg,#10b981,#059669)':'rgba(239,68,68,.18)')+';color:'+(on?'#fff':'#ef4444')+'">'+(on?'ON':'OFF')+'</button></div>';
  }).join('')+'</div>';
}
async function loadMentorAccess(){
  var box=document.getElementById('mentorAccessList'); if(!box) return;
  renderMentorAccess(window.mentorAccessState && Object.keys(window.mentorAccessState).length ? window.mentorAccessState : {});
  if(typeof sb==='undefined' || !sb || !sb.from){ console.warn('Supabase client not ready for mentor access'); return; }
  try{
    var query=sb.from('mentor_access_settings').select('key,enabled').order('key',{ascending:true});
    var timeout=new Promise(function(_,reject){setTimeout(function(){reject(new Error('Supabase request timeout'));},8000);});
    var r=await Promise.race([query,timeout]);
    if(r.error) throw r.error;
    var settings={};
    (r.data||[]).forEach(function(s){ settings[s.key]=s.enabled!==false; });
    renderMentorAccess(settings);
  }catch(e){
    console.error('Mentor access load error:', e);
    renderMentorAccess(window.mentorAccessState && Object.keys(window.mentorAccessState).length ? window.mentorAccessState : {});
  }
}
window.toggleMentorAccess = async function(key, enabled){
  if(!window.mentorAccessState) window.mentorAccessState=getMentorAccessState({});
  var previous=window.mentorAccessState[key];
  window.mentorAccessState[key]=enabled===true;
  renderMentorAccess(window.mentorAccessState);
  if(typeof sb==='undefined' || !sb || !sb.from){
    alert('Supabase client ready nahi. Page refresh karke dobara try karo.');
    window.mentorAccessState[key]=previous;
    renderMentorAccess(window.mentorAccessState);
    return;
  }
  try{
    // Update first; if row does not exist, upsert will create it.
    var res=await sb.from('mentor_access_settings').upsert({key:key,enabled:enabled===true,updated_at:new Date().toISOString()},{onConflict:'key'}).select('key,enabled').single();
    if(res.error) throw res.error;
    window.mentorAccessState[key]=res.data.enabled!==false;
    renderMentorAccess(window.mentorAccessState);
  }catch(e){
    console.error('Mentor access save error:', e);
    alert('Save error: '+(e.message||'Unknown error'));
    window.mentorAccessState[key]=previous;
    renderMentorAccess(window.mentorAccessState);
  }
};


// Extra safe click handler for Mentor Access buttons (works even if inline onclick is blocked)
document.addEventListener('click', function(e){
  var btn = e.target.closest && e.target.closest('.mentor-access-btn');
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();
  var key = btn.getAttribute('data-key');
  var current = btn.getAttribute('data-enabled') === 'true';
  if(key && typeof window.toggleMentorAccess === 'function'){
    window.toggleMentorAccess(key, !current);
  }
}, true);

window.setMentorAccessPreset = async function(type){
  var onKeys=[];
  if(type==='all') onKeys=MENTOR_ACCESS_DEFS.map(function(x){return x[0];});
  else if(type==='basic') onKeys=['dashboard','signals','charts','articles','settings'];
  else onKeys=['dashboard','signals','charts','articles','settings'];
  var next={}; MENTOR_ACCESS_DEFS.forEach(function(t){next[t[0]]=onKeys.indexOf(t[0])>-1;});
  var previous=Object.assign({}, window.mentorAccessState||{});
  window.mentorAccessState=next; renderMentorAccess(next);
  if(typeof sb==='undefined' || !sb || !sb.from){alert('Supabase client ready nahi. Page refresh karke dobara try karo.'); return;}
  try{
    var rows=MENTOR_ACCESS_DEFS.map(function(t){return {key:t[0],enabled:onKeys.indexOf(t[0])>-1,updated_at:new Date().toISOString()};});
    var res=await sb.from('mentor_access_settings').upsert(rows,{onConflict:'key'});
    if(res.error) throw res.error;
    await loadMentorAccess();
  }catch(e){
    console.error('Mentor access preset save error:', e);
    alert('Save error: '+(e.message||'Unknown error'));
    window.mentorAccessState=previous; renderMentorAccess(previous);
  }
};

function toggleTheme() {
  const html = document.documentElement;
  const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  document.getElementById('themeBtn').textContent = newTheme === 'dark' ? '🌙' : '☀️';
}

// ============ LOAD REAL STATS FROM DATABASE ============
async function loadDashboardStats() {
  if (typeof window.loadDashboardStats==='function' && window.loadDashboardStats!==loadDashboardStats) {
    return window.loadDashboardStats.apply(window, arguments);
  }
  if (!sb) return;
  
  try {
    // Counts
    const { count: usersCount } = await sb.from('profiles').select('*', { count: 'exact', head: true });
    const { count: tradesCount } = await sb.from('trades').select('*', { count: 'exact', head: true });
    const { count: premiumCount } = await sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true);
    const { count: coursesCount } = await sb.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true);
    const { count: quizCount } = await sb.from('quiz_questions').select('*', { count: 'exact', head: true });
    const { count: newsCount } = await sb.from('news_posts').select('*', { count: 'exact', head: true }).eq('is_published', true);
    const { count: quizPlaysCount } = await sb.from('quiz_history').select('*', { count: 'exact', head: true });
    
    // Calculate revenue (premium users × $30 default)
    const revenue = (premiumCount || 0) * 30;
    
    // Update top 4 stat cards
    const statValues = document.querySelectorAll('#page-dashboard .stats-grid:first-of-type .stat-value');
    if (statValues[0]) statValues[0].textContent = (usersCount || 0).toLocaleString();
    const sidebarCount = document.getElementById('sidebarUsersCount');
    if (sidebarCount) sidebarCount.textContent = (usersCount || 0).toLocaleString();
    if (statValues[1]) statValues[1].textContent = (tradesCount || 0).toLocaleString();
    if (statValues[2]) statValues[2].textContent = (premiumCount || 0).toLocaleString();
    if (statValues[3]) statValues[3].textContent = (coursesCount || 0).toLocaleString();
    
    // Update bottom 4 stat cards
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('statRevenue', '$' + revenue.toLocaleString());
    setEl('statQuizPlays', (quizPlaysCount || 0).toLocaleString());
    setEl('statNewsCount', (newsCount || 0).toLocaleString());
    setEl('statQuizCount', (quizCount || 0).toLocaleString());
    
    // Recent signups
    const { data: recentUsers } = await sb.from('profiles').select('full_name, email, created_at').order('created_at', { ascending: false }).limit(5);
    const signupsList = document.getElementById('recentSignupsList');
    if (signupsList) {
      if (recentUsers && recentUsers.length > 0) {
        signupsList.innerHTML = recentUsers.map(u => {
          const initials = (u.full_name || u.email || 'U').slice(0, 2).toUpperCase();
          const timeAgo = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `<div class="activity-item">
            <div class="activity-icon" style="background: var(--green-bg); color: var(--green);">${initials}</div>
            <div class="activity-content">
              <div class="activity-text"><strong>${u.full_name || u.email.split('@')[0]}</strong> signed up</div>
              <div class="activity-time">${timeAgo} · ${u.email}</div>
            </div>
          </div>`;
        }).join('');
      } else {
        signupsList.innerHTML = '<div class="empty-state" style="height: 120px;"><div class="empty-icon">👥</div><div style="font-size: 12px;">No signups yet</div></div>';
      }
    }
    
    // Top traded pairs (group by pair)
    const { data: allTrades } = await sb.from('trades').select('pair, pnl, user_id');
    if (allTrades) {
      const pairCounts = {};
      const userPLs = {};
      allTrades.forEach(t => {
        pairCounts[t.pair] = (pairCounts[t.pair] || 0) + 1;
        userPLs[t.user_id] = (userPLs[t.user_id] || 0) + parseFloat(t.pnl || 0);
      });
      const topPairs = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      
      const topPairsList = document.getElementById('topPairsList');
      if (topPairsList) {
        if (topPairs.length > 0) {
          const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
          topPairsList.innerHTML = topPairs.map(([pair, count], i) => 
            `<div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border);"><span>${medals[i]} ${pair}</span><strong>${count}</strong></div>`
          ).join('');
        } else {
          topPairsList.innerHTML = '<div class="empty-state" style="height: 120px;"><div style="font-size: 12px;">No trades yet</div></div>';
        }
      }
      
      // Top users by profit
      const topUserIds = Object.entries(userPLs).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const topUsersList = document.getElementById('topUsersList');
      if (topUsersList && topUserIds.length > 0) {
        const userIds = topUserIds.map(([id]) => id);
        const { data: topUserProfiles } = await sb.from('profiles').select('id, full_name, email').in('id', userIds);
        const profileMap = {};
        (topUserProfiles || []).forEach(p => { profileMap[p.id] = p; });
        
        const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
        topUsersList.innerHTML = topUserIds.map(([uid, pl], i) => {
          const profile = profileMap[uid];
          const name = profile ? (profile.full_name || profile.email.split('@')[0]) : 'Unknown';
          const color = pl >= 0 ? 'var(--green)' : 'var(--red)';
          const prefix = pl >= 0 ? '+$' : '-$';
          return `<div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border);"><span>${medals[i]} ${name}</span><strong style="color: ${color};">${prefix}${Math.abs(pl).toFixed(2)}</strong></div>`;
        }).join('');
      } else if (topUsersList) {
        topUsersList.innerHTML = '<div class="empty-state" style="height: 120px;"><div style="font-size: 12px;">No traders yet</div></div>';
      }
    }
    
    // Platform stats card
    const platformStatsList = document.getElementById('platformStatsList');
    if (platformStatsList) {
      platformStatsList.innerHTML = `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border);"><span>Total Signups</span><strong style="color: var(--green);">${usersCount || 0}</strong></div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border);"><span>Premium Users</span><strong style="color: var(--gold);">${premiumCount || 0}</strong></div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border);"><span>Total Trades</span><strong>${tradesCount || 0}</strong></div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border);"><span>Quiz Plays</span><strong>${quizPlaysCount || 0}</strong></div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0;"><span>Active Courses</span><strong>${coursesCount || 0}</strong></div>
      `;
    }
    
    console.log('✅ Dashboard stats loaded');
  } catch (e) {
    console.error('Stats load error:', e);
  }
}

// ============ LOAD REAL USERS LIST ============
async function loadAdminUsers() {
  if (!sb) return;
  
  const { data: users, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  
  if (error || !users) {
    console.error('Users load error:', error);
    return;
  }
  
  const tbody = document.querySelector('#page-users table tbody');
  if (!tbody) return;
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">No users yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(u => {
    const byId = {}; users.forEach(x => byId[x.id] = x);
    const initials = (u.full_name || u.email || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);
    const date = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const status = u.is_banned ? '<span class="badge banned">Banned</span>' : '<span class="badge active">Active</span>';
    const plan = u.is_premium ? '<span class="badge premium">'+(u.member_type==='vip'?'VIP':'Premium')+'</span>' : '<span class="badge free">Free</span>';
    const isAdmin = (u.role==='admin') || u.is_admin;
    const isMentor = u.role==='mentor';
    const roleBadge = isAdmin
      ? '<span class="badge premium" style="margin-left:4px">⚡ ADMIN</span>'
      : (isMentor ? '<span class="badge" style="margin-left:4px;background:rgba(245,158,11,.2);color:#f59e0b">🎓 MENTOR</span>'
                  : '<span class="badge" style="margin-left:4px;background:rgba(59,130,246,.18);color:#60a5fa">👤 USER</span>');
    let mentorLine = '';
    if (isMentor && u.mentor_code) {
      mentorLine = '<div style="font-size:10.5px;color:var(--text-muted);margin-top:2px">Code: '+u.mentor_code+'</div>';
    } else if (!isAdmin && !isMentor) {
      const mn = u.mentor_id && byId[u.mentor_id] ? (byId[u.mentor_id].full_name || byId[u.mentor_id].email) : null;
      mentorLine = '<div style="font-size:10.5px;color:var(--text-muted);margin-top:2px">'+(mn ? ('🎓 Under: '+mn) : '🌐 No mentor (PipSePaisa)')+'</div>';
    }

    const whatsapp = u.whatsapp || u.whatsapp_number || u.phone || u.mobile || '-';
    const country = u.country || '🌐 Unknown';
    return `<tr>
      <td><div class="user-cell"><div class="user-cell-avatar" style="background: linear-gradient(135deg, #f59e0b, #d97706);">${initials}</div><div><div class="user-cell-name">${u.full_name || 'No name'}${roleBadge}</div></div></div></td>
      <td>${u.email || '-'}</td>
      <td>${whatsapp}</td>
      <td>${country}</td>
      <td>${date}</td>
    </tr>`;
  }).join('');
  
  console.log('✅ Loaded ' + users.length + ' users');
}

// ============ LOAD REAL TRADES LIST ============
async function exportTradesCSV(){
  if(!sb)return;
  const {data}=await sb.from('trades').select('*, profiles(full_name,email)').order('created_at',{ascending:false});
  const rows=data||[];
  if(!rows.length){alert('No trades to export');return;}
  const head=['Date','User','Pair','Direction','Lot','Entry','Exit','PnL','Strategy'];
  const csv=[head.join(',')].concat(rows.map(function(t){
    const u=t.profiles?(t.profiles.full_name||t.profiles.email||''):'';
    const cell=function(v){v=(v==null?'':String(v));return '"'+v.replace(/"/g,'""')+'"';};
    return [new Date(t.created_at).toLocaleString(),u,t.pair,t.direction,t.lot_size,t.entry_price,(t.exit_price||''),(t.pnl||0),(t.strategy||'')].map(cell).join(',');
  })).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='trades_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
}
async function loadAdminTrades() {
  if (!sb) return;
  
  // Stats from ALL trades
  try {
    const { data: allT } = await sb.from('trades').select('pnl');
    const arr = allT || [];
    const total = arr.length;
    let prof = 0, loss = 0, sum = 0;
    arr.forEach(t => { const p = parseFloat(t.pnl) || 0; sum += p; if (p > 0) prof++; else if (p < 0) loss++; });
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('tradesAllCount', total);
    set('tradesProfitableCount', prof);
    set('tradesLossesCount', loss);
    set('tradesProfitablePct', total ? Math.round(prof / total * 100) + '%' : '0%');
    set('tradesLossesPct', total ? Math.round(loss / total * 100) + '%' : '0%');
    set('tradesTotalPnL', (sum >= 0 ? '+$' : '-$') + Math.abs(sum).toFixed(2));
  } catch (e) {}
  
  const { data: trades, error } = await sb.from('trades').select('*, profiles(full_name, email)').order('created_at', { ascending: false }).limit(50);
  
  if (error || !trades) {
    console.error('Trades load error:', error);
    return;
  }
  
  const tbody = document.querySelector('#page-trades table tbody');
  if (!tbody) return;
  
  if (trades.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">No trades yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = trades.map(t => {
    const time = new Date(t.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const userName = t.profiles?.full_name || t.profiles?.email?.split('@')[0] || 'Unknown';
    const dirBadge = t.direction === 'BUY' ? '<span class="badge active">BUY</span>' : '<span class="badge banned">SELL</span>';
    const pnl = parseFloat(t.pnl) || 0;
    const pnlColor = pnl >= 0 ? 'var(--green)' : 'var(--red)';
    const pnlPrefix = pnl >= 0 ? '+$' : '-$';
    
    return `<tr>
      <td>${time}</td>
      <td>${userName}</td>
      <td><strong>${t.pair}</strong></td>
      <td>${dirBadge}</td>
      <td>${t.lot_size}</td>
      <td>${t.entry_price}</td>
      <td>${t.exit_price || '-'}</td>
      <td style="color: ${pnlColor}; font-weight: 700;">${pnlPrefix}${Math.abs(pnl).toFixed(2)}</td>
      <td>${t.strategy || '-'}</td>
    </tr>`;
  }).join('');
  
  console.log('✅ Loaded ' + trades.length + ' trades');
}

// ============ LOAD ADMIN COURSES (with edit/delete actions) ============
async function loadAdminCourses() {
  if (!sb) return;
  
  const { data: courses, error } = await sb.from('courses').select('*').order('display_order');
  
  if (error || !courses) return;
  
  const grid = document.querySelector('#page-courses .courses-grid');
  if (!grid) return;
  
  // Keep "Add new" card at end if exists, but use real courses
  const colors = [1, 2, 3, 4, 5, 6];
  grid.innerHTML = courses.map((c, i) => {
    const colorIdx = (c.thumbnail_color || colors[i % 6]);
    const statusBadge = c.is_published ? '<span class="badge published">Published</span>' : '<span class="badge draft">Draft</span>';
    const premiumBadge = c.is_premium ? '<span style="position: absolute; top: 12px; right: 12px; padding: 3px 8px; background: var(--gold); color: #0a0e1a; font-size: 9px; font-weight: 800; border-radius: 4px;">⭐ PREMIUM</span>' : '';
    return `<div class="course-card">
      <div class="course-thumb course-thumb-bg-${colorIdx}" style="position: relative;${c.thumbnail ? `background:#000 url('${c.thumbnail}') center/cover;` : ''}">
        ${c.thumbnail ? '' : `<span>${c.thumbnail_emoji || '📚'}</span>`}
        <span class="level-badge">${c.level || 'All Levels'}</span>
        ${premiumBadge}
      </div>
      <h3>${c.title}</h3>
      <p>${c.description || ''}</p>
      <div class="course-meta">
        <span>👥 ${c.enrollments_count || 0} enrolled</span>
        ${c.is_premium?`<span>💵 $${Number(c.price||0).toFixed(0)}</span>`:''}
        ${c.is_premium&&Number(c.local_bank_price_pkr||0)>0?`<span>🏦 PKR ${Number(c.local_bank_price_pkr||0).toLocaleString('en-US')}</span>`:''}
        ${statusBadge}
      </div>
      <div style="display: flex; gap: 6px; margin-top: 12px;">
        <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="editCourse('${c.id}')">✏️ Edit</button>
        <button class="action-btn delete" style="padding: 6px 10px;" onclick="deleteCourse('${c.id}', '${c.title.replace(/'/g, "")}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
  
  console.log('✅ Loaded ' + courses.length + ' courses');
}

async function deleteCourse(id, title) {
  if (!(await window.pspConfirm('Delete course "' + title + '"? This cannot be undone.'))) return;
  
  const { error } = await sb.from('courses').delete().eq('id', id);
  if (error) {
    alert('❌ Error: ' + error.message);
    return;
  }
  alert('✅ Course deleted');
  loadAdminCourses();
}

// Modal helpers
function openModal(name) { document.getElementById('modal-' + name).classList.add('active'); }
function closeModal(name) { document.getElementById('modal-' + name).classList.remove('active'); }

// ============ COURSE FORM ============
function openCourseForm(course) {
  document.getElementById('courseFormError').style.display = 'none';
  if (course) {
    document.getElementById('courseFormTitle').textContent = 'Edit Course';
    document.getElementById('courseId').value = course.id;
    document.getElementById('courseTitle').value = course.title || '';
    document.getElementById('courseDescription').value = course.description || '';
    document.getElementById('courseLevel').value = course.level || 'Beginner';
    document.getElementById('courseCategory').value = course.category || '';
    document.getElementById('courseThumbnail').value = course.thumbnail || '';
    { const _p=document.getElementById('courseThumbPrev'); if(_p)_p.innerHTML = course.thumbnail ? ('<div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap"><img src="'+course.thumbnail+'" style="width:240px;aspect-ratio:16/9;object-fit:contain;background:#0b1426;border-radius:10px;border:1px solid var(--border)"><button type="button" class="btn btn-secondary btn-sm" onclick="removeCourseThumbnail()">Remove</button></div>') : ''; const _f=document.getElementById('courseThumbFile'); if(_f)_f.value=''; }
    { const _price=document.getElementById('coursePrice'); if(_price)_price.value=Number(course.price!=null?course.price:(course.is_premium?250:0)); }
    { const _lb=document.getElementById('courseLocalBankPrice'); if(_lb)_lb.value=Number(course.local_bank_price_pkr||0)>0?Number(course.local_bank_price_pkr):''; }
    document.getElementById('courseEmoji').value = course.thumbnail_emoji || '📚';
    document.getElementById('courseColor').value = course.thumbnail_color || 1;
    document.getElementById('courseYoutubeUrl').value = course.youtube_url || '';
    document.getElementById('courseOrder').value = course.display_order || 0;
    document.getElementById('courseEnrollments').value = course.enrollments_count || 0;
    document.getElementById('coursePublished').checked = !!course.is_published;
    document.getElementById('coursePremium').checked = !!course.is_premium;
  } else {
    document.getElementById('courseFormTitle').textContent = 'Add New Course';
    ['courseId','courseTitle','courseDescription','courseCategory','courseYoutubeUrl'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('courseThumbnail').value = '';
    { const _p=document.getElementById('courseThumbPrev'); if(_p)_p.innerHTML=''; const _f=document.getElementById('courseThumbFile'); if(_f)_f.value=''; }
    document.getElementById('courseEmoji').value = '📚';
    document.getElementById('courseColor').value = '1';
    document.getElementById('courseLevel').value = 'Beginner';
    document.getElementById('courseOrder').value = '0';
    document.getElementById('courseEnrollments').value = '0';
    { const _price=document.getElementById('coursePrice'); if(_price)_price.value='0'; }
    { const _lb=document.getElementById('courseLocalBankPrice'); if(_lb)_lb.value=''; }
    document.getElementById('coursePublished').checked = true;
    document.getElementById('coursePremium').checked = false;
  }
  openModal('courseForm');
}

async function editCourse(id) {
  const { data: course, error } = await sb.from('courses').select('*').eq('id', id).single();
  if (error) { alert('❌ Error: ' + error.message); return; }
  openCourseForm(course);
}

async function saveCourse() {
  const errEl = document.getElementById('courseFormError');
  const btn = document.getElementById('saveCourseBtn');
  errEl.style.display = 'none';
  
  const id = document.getElementById('courseId').value;
  const title = document.getElementById('courseTitle').value.trim();
  
  if (!title) {
    errEl.textContent = '❌ Title is required';
    errEl.style.display = 'block';
    return;
  }
  
  btn.textContent = '⏳ Saving...';
  btn.disabled = true;
  
  const data = {
    title,
    description: document.getElementById('courseDescription').value.trim(),
    short_description: document.getElementById('courseDescription').value.trim(),
    modules_json: typeof window.pspCollectCourseModulesV29==='function' ? window.pspCollectCourseModulesV29() : [],
    level: document.getElementById('courseLevel').value,
    category: document.getElementById('courseCategory').value.trim(),
    thumbnail: document.getElementById('courseThumbnail').value.trim() || null,
    thumbnail_emoji: document.getElementById('courseEmoji').value || '📚',
    thumbnail_color: parseInt(document.getElementById('courseColor').value),
    youtube_url: document.getElementById('courseYoutubeUrl').value.trim() || null,
    display_order: parseInt(document.getElementById('courseOrder').value) || 0,
    enrollments_count: parseInt(document.getElementById('courseEnrollments').value) || 0,
    is_published: document.getElementById('coursePublished').checked,
    is_premium: document.getElementById('coursePremium').checked,
    price: Math.max(0, parseFloat((document.getElementById('coursePrice')||{value:'0'}).value) || 0),
    currency: 'USD',
    local_bank_price_pkr: Math.max(0, parseFloat((document.getElementById('courseLocalBankPrice')||{value:'0'}).value) || 0)
  };
  
  let result = id 
    ? await sb.from('courses').update(data).eq('id', id)
    : await sb.from('courses').insert(data);
  if(result.error && /price.*column|column.*price|local_bank_price_pkr|currency.*column|schema cache.*price|modules_json|short_description/i.test(String(result.error.message||''))){
    delete data.price;
    delete data.currency;
    delete data.local_bank_price_pkr;
    delete data.modules_json;
    delete data.short_description;
    result = id ? await sb.from('courses').update(data).eq('id', id) : await sb.from('courses').insert(data);
  }
  
  btn.textContent = '💾 Save Course';
  btn.disabled = false;
  
  if (result.error) {
    errEl.textContent = '❌ ' + result.error.message;
    errEl.style.display = 'block';
    return;
  }
  
  closeModal('courseForm');
  alert('✅ Course ' + (id ? 'updated' : 'added') + '!');
  loadAdminCourses();
}

// ============ LOAD ADMIN NEWS (with edit/delete) ============
async function loadAdminNewsPosts() {
  if (!sb) return;
  
  const { data: news, error } = await sb.from('news_posts').select('*').order('created_at', { ascending: false });
  
  if (error || !news) return;
  
  const tbody = document.querySelector('#page-news table tbody');
  if (!tbody) return;
  
  if (news.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">No news posts yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = news.map(n => {
    const date = new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const priorityBadge = `<span class="badge ${n.priority === 'High' ? 'high' : (n.priority === 'Medium' ? 'medium' : 'low')}">${n.priority}</span>`;
    const statusBadge = n.is_published ? '<span class="badge published">Live</span>' : '<span class="badge draft">Draft</span>';
    const icon = n.priority === 'High' ? '🔴' : (n.priority === 'Medium' ? '📊' : '📈');
    
    return `<tr>
      <td><strong>${icon} ${n.title}</strong></td>
      <td>${priorityBadge}</td>
      <td>${date}</td>
      <td>${n.views_count || 0}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="action-btn" onclick="editNews('${n.id}')">✏️</button>
        <button class="action-btn delete" onclick="deleteNews('${n.id}', '${n.title.replace(/'/g, "")}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

async function deleteNews(id, title) {
  if (!(await window.pspConfirm('Delete news "' + title + '"?'))) return;
  const { error } = await sb.from('news_posts').delete().eq('id', id);
  if (error) { alert('❌ ' + error.message); return; }
  alert('✅ News deleted');
  loadAdminNewsPosts();
}

// ============ NEWS FORM ============
function openNewsForm(news) {
  document.getElementById('newsFormError').style.display = 'none';
  if (news) {
    document.getElementById('newsFormTitle').textContent = 'Edit News Post';
    document.getElementById('newsId').value = news.id;
    document.getElementById('newsTitle').value = news.title || '';
    document.getElementById('newsContent').value = news.content || '';
    document.getElementById('newsPriority').value = news.priority || 'Medium';
    document.getElementById('newsPublished').checked = !!news.is_published;
  } else {
    document.getElementById('newsFormTitle').textContent = 'Add News Post';
    ['newsId','newsTitle','newsContent'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('newsPriority').value = 'Medium';
    document.getElementById('newsPublished').checked = true;
  }
  openModal('newsForm');
}

async function editNews(id) {
  const { data, error } = await sb.from('news_posts').select('*').eq('id', id).single();
  if (error) { alert('❌ ' + error.message); return; }
  openNewsForm(data);
}

async function saveNews() {
  const errEl = document.getElementById('newsFormError');
  const btn = document.getElementById('saveNewsBtn');
  errEl.style.display = 'none';
  
  const id = document.getElementById('newsId').value;
  const title = document.getElementById('newsTitle').value.trim();
  
  if (!title) {
    errEl.textContent = '❌ Title is required';
    errEl.style.display = 'block';
    return;
  }
  
  btn.textContent = '⏳ Saving...';
  btn.disabled = true;
  
  const data = {
    title,
    content: document.getElementById('newsContent').value.trim(),
    priority: document.getElementById('newsPriority').value,
    is_published: document.getElementById('newsPublished').checked
  };
  
  const result = id
    ? await sb.from('news_posts').update(data).eq('id', id)
    : await sb.from('news_posts').insert(data);
  
  btn.textContent = '💾 Save Post';
  btn.disabled = false;
  
  if (result.error) {
    errEl.textContent = '❌ ' + result.error.message;
    errEl.style.display = 'block';
    return;
  }
  
  closeModal('newsForm');
  alert('✅ News ' + (id ? 'updated' : 'added') + '!');
  loadAdminNewsPosts();
}

// ============ LOAD ADMIN QUIZ QUESTIONS ============
async function loadAdminQuiz() {
  if (!sb) return;
  
  const { data: questions, error } = await sb.from('quiz_questions').select('*');
  
  if (error || !questions) return;
  
  const tbody = document.querySelector('#page-quiz table tbody');
  if (!tbody) return;
  
  if (questions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">No questions yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = questions.map((q, i) => {
    const correctPct = q.times_asked > 0 ? Math.round((q.times_correct / q.times_asked) * 100) : 0;
    const correctColor = correctPct >= 70 ? 'var(--green)' : (correctPct >= 50 ? 'var(--gold)' : 'var(--red)');
    return `<tr>
      <td>${i + 1}</td>
      <td style="font-weight: 600;">${q.question}</td>
      <td><span class="badge premium">${q.category || 'General'}</span></td>
      <td>${q.difficulty || 'Easy'}</td>
      <td>${q.times_asked || 0}</td>
      <td style="color: ${correctColor};">${correctPct}%</td>
      <td><button class="action-btn" onclick="editQuiz('${q.id}')">✏️</button><button class="action-btn delete" onclick="deleteQuiz('${q.id}')">🗑️</button></td>
    </tr>`;
  }).join('');
}

async function deleteQuiz(id) {
  if (!(await window.pspConfirm('Delete this question?'))) return;
  const { error } = await sb.from('quiz_questions').delete().eq('id', id);
  if (error) { alert('❌ ' + error.message); return; }
  alert('✅ Deleted');
  loadAdminQuiz();
}

// ============ QUIZ FORM ============
function openQuizForm(q) {
  document.getElementById('quizFormError').style.display = 'none';
  if (q) {
    document.getElementById('quizFormTitle').textContent = 'Edit Question';
    document.getElementById('quizId').value = q.id;
    document.getElementById('quizQuestion').value = q.question || '';
    document.getElementById('quizOptA').value = q.option_a || '';
    document.getElementById('quizOptB').value = q.option_b || '';
    document.getElementById('quizOptC').value = q.option_c || '';
    document.getElementById('quizOptD').value = q.option_d || '';
    document.getElementById('quizCorrect').value = q.correct_answer ?? 0;
    document.getElementById('quizCategory').value = q.category || 'Basics';
    document.getElementById('quizDifficulty').value = q.difficulty || 'Easy';
  } else {
    document.getElementById('quizFormTitle').textContent = 'Add Quiz Question';
    ['quizId','quizQuestion','quizOptA','quizOptB','quizOptC','quizOptD'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('quizCorrect').value = '0';
    document.getElementById('quizCategory').value = 'Basics';
    document.getElementById('quizDifficulty').value = 'Easy';
  }
  openModal('quizForm');
}

async function editQuiz(id) {
  const { data, error } = await sb.from('quiz_questions').select('*').eq('id', id).single();
  if (error) { alert('❌ ' + error.message); return; }
  openQuizForm(data);
}

async function saveQuizQ() {
  const errEl = document.getElementById('quizFormError');
  const btn = document.getElementById('saveQuizBtn');
  errEl.style.display = 'none';
  
  const id = document.getElementById('quizId').value;
  const question = document.getElementById('quizQuestion').value.trim();
  const a = document.getElementById('quizOptA').value.trim();
  const b = document.getElementById('quizOptB').value.trim();
  const c = document.getElementById('quizOptC').value.trim();
  const d = document.getElementById('quizOptD').value.trim();
  
  if (!question || !a || !b || !c || !d) {
    errEl.textContent = '❌ All fields are required (question + 4 options)';
    errEl.style.display = 'block';
    return;
  }
  
  btn.textContent = '⏳ Saving...';
  btn.disabled = true;
  
  const data = {
    question,
    option_a: a, option_b: b, option_c: c, option_d: d,
    correct_answer: parseInt(document.getElementById('quizCorrect').value),
    category: document.getElementById('quizCategory').value.trim() || 'Basics',
    difficulty: document.getElementById('quizDifficulty').value
  };
  
  const result = id
    ? await sb.from('quiz_questions').update(data).eq('id', id)
    : await sb.from('quiz_questions').insert(data);
  
  btn.textContent = '💾 Save Question';
  btn.disabled = false;
  
  if (result.error) {
    errEl.textContent = '❌ ' + result.error.message;
    errEl.style.display = 'block';
    return;
  }
  
  closeModal('quizForm');
  alert('✅ Question ' + (id ? 'updated' : 'added') + '!');
  loadAdminQuiz();
}

// ============ YOUTUBE VIDEOS LOADER ============
async function loadAdminYoutube() {
  if (!sb) return;
  
  const { data, error } = await sb.from('youtube_videos').select('*').order('display_order');
  
  const grid = document.getElementById('youtubeVideosGrid');
  if (!grid) return;
  
  if (error || !data || data.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; height: 150px;"><div class="empty-icon">📭</div><div>No videos yet. Click "+ Add Video" to start!</div></div>';
    return;
  }
  
  grid.innerHTML = data.map(v => {
    const thumbnail = `https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`;
    const youtubeWatchUrl = `https://www.youtube.com/watch?v=${v.youtube_id}`;
    return `<div style="background: var(--bg-elevated); border-radius: 10px; overflow: hidden;">
      <div style="position: relative; cursor: pointer;" onclick="window.open('${youtubeWatchUrl}', '_blank')">
        <img src="${thumbnail}" style="width: 100%; height: 140px; object-fit: cover; display: block;" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #ff0000, #cc0000)'; this.parentElement.style.height='140px'; this.parentElement.style.display='flex'; this.parentElement.style.alignItems='center'; this.parentElement.style.justifyContent='center'; this.parentElement.innerHTML += '<span style=color:white;font-size:48px>▶</span>';">
        ${!v.is_featured ? '<span style="position: absolute; top: 8px; left: 8px; padding: 3px 8px; background: rgba(0,0,0,0.7); color: var(--gold); border-radius: 4px; font-size: 9px; font-weight: 700;">HIDDEN</span>' : ''}
      </div>
      <div style="padding: 12px;">
        <h4 style="font-size: 13px; margin-bottom: 4px; min-height: 36px;">${v.title}</h4>
        <p style="font-size: 11px; color: var(--text-muted);">👁️ ${(v.views_count || 0).toLocaleString()} views</p>
        <div style="display: flex; gap: 6px; margin-top: 10px;">
          <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="editYoutube('${v.id}')">✏️ Edit</button>
          <button class="action-btn delete" style="padding: 6px 10px;" onclick="deleteYoutube('${v.id}', '${v.title.replace(/'/g, "")}')">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function extractYoutubeId(url) {
  if (!url) return null;
  url = url.trim();
  // Already just an ID (11 chars typical)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  // Various URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function openYoutubeForm(video) {
  document.getElementById('youtubeFormError').style.display = 'none';
  if (video) {
    document.getElementById('youtubeFormTitle').textContent = 'Edit YouTube Video';
    document.getElementById('youtubeId').value = video.id;
    document.getElementById('youtubeUrl').value = video.youtube_id || '';
    document.getElementById('youtubeTitle').value = video.title || '';
    document.getElementById('youtubeDescription').value = video.description || '';
    document.getElementById('youtubeViews').value = video.views_count || 0;
    document.getElementById('youtubeOrder').value = video.display_order || 0;
    document.getElementById('youtubeFeatured').checked = !!video.is_featured;
  } else {
    document.getElementById('youtubeFormTitle').textContent = 'Add YouTube Video';
    ['youtubeId','youtubeUrl','youtubeTitle','youtubeDescription'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('youtubeViews').value = '0';
    document.getElementById('youtubeOrder').value = '0';
    document.getElementById('youtubeFeatured').checked = true;
  }
  openModal('youtubeForm');
}

async function editYoutube(id) {
  const { data, error } = await sb.from('youtube_videos').select('*').eq('id', id).single();
  if (error) { alert('❌ ' + error.message); return; }
  openYoutubeForm(data);
}

async function deleteYoutube(id, title) {
  if (!(await window.pspConfirm('Delete video "' + title + '"?'))) return;
  const { error } = await sb.from('youtube_videos').delete().eq('id', id);
  if (error) { alert('❌ ' + error.message); return; }
  alert('✅ Video deleted');
  loadAdminYoutube();
}

async function saveYoutube() {
  const errEl = document.getElementById('youtubeFormError');
  const btn = document.getElementById('saveYoutubeBtn');
  errEl.style.display = 'none';
  
  const id = document.getElementById('youtubeId').value;
  const url = document.getElementById('youtubeUrl').value.trim();
  const title = document.getElementById('youtubeTitle').value.trim();
  
  if (!url || !title) {
    errEl.textContent = '❌ URL and Title are required';
    errEl.style.display = 'block';
    return;
  }
  
  const ytId = extractYoutubeId(url);
  if (!ytId) {
    errEl.textContent = '❌ Invalid YouTube URL or video ID';
    errEl.style.display = 'block';
    return;
  }
  
  btn.textContent = '⏳ Saving...';
  btn.disabled = true;
  
  const data = {
    youtube_id: ytId,
    title,
    description: document.getElementById('youtubeDescription').value.trim(),
    views_count: parseInt(document.getElementById('youtubeViews').value) || 0,
    display_order: parseInt(document.getElementById('youtubeOrder').value) || 0,
    is_featured: document.getElementById('youtubeFeatured').checked,
    thumbnail_url: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
  };
  
  const result = id
    ? await sb.from('youtube_videos').update(data).eq('id', id)
    : await sb.from('youtube_videos').insert(data);
  
  btn.textContent = '💾 Save Video';
  btn.disabled = false;
  
  if (result.error) {
    errEl.textContent = '❌ ' + result.error.message;
    errEl.style.display = 'block';
    return;
  }
  
  closeModal('youtubeForm');
  alert('✅ Video ' + (id ? 'updated' : 'added') + '!');
  loadAdminYoutube();
}

async function initCharts() {
  if(window.PSPExecutiveDashboard181)return;
  // User Growth Chart - REAL DATA from signups
  const ctx1 = document.getElementById('growthChart');
  if (ctx1) {
    const { data: users } = await sb.from('profiles').select('created_at').order('created_at', { ascending: true });
    
    // Group signups by week (last 4 weeks)
    const now = new Date();
    const weeks = [];
    const weekLabels = [];
    let cumulative = 0;
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(now.getTime() - (i * 7 * 86400000));
      const count = (users || []).filter(u => new Date(u.created_at) <= weekEnd).length;
      weeks.push(count);
      weekLabels.push('Wk ' + (4 - i));
    }
    
    new Chart(ctx1, {
      type: 'line',
      data: {
        labels: weekLabels,
        datasets: [{
          label: 'Total Users',
          data: weeks,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true, tension: 0.4, pointRadius: 5, borderWidth: 2,
          pointBackgroundColor: '#f59e0b'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(100,116,139,0.16)' }, ticks: { color: '#6b7280', stepSize: 1 } },
          x: { grid: { display: false }, ticks: { color: '#6b7280' } }
        }
      }
    });
  }
  
  // Traffic Chart - REAL DATA from trades by day
  const ctx2 = document.getElementById('trafficChart');
  if (ctx2) {
    const { data: trades } = await sb.from('trades').select('created_at');
    
    // Group trades by day of week (M T W T F S S)
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    (trades || []).forEach(t => {
      const day = new Date(t.created_at).getDay(); // 0=Sun, 1=Mon
      const idx = day === 0 ? 6 : day - 1;
      dayCounts[idx]++;
    });
    
    new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [{
          data: dayCounts,
          backgroundColor: 'rgba(245, 158, 11, 0.7)',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(100,116,139,0.16)' }, ticks: { color: '#6b7280', stepSize: 1 } },
          x: { grid: { display: false }, ticks: { color: '#6b7280' } }
        }
      }
    });
  }
}
