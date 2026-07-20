
let PROFILE=null;
document.addEventListener('DOMContentLoaded',async()=>{
  PSP.bindShell();
  const role=document.body.dataset.role;
  PROFILE=await PSP.requireRole(role?[role]:[]);
  if(!PROFILE) return;
  $$('.profile-name').forEach(x=>x.textContent=PROFILE.full_name||PROFILE.email||'Member');
  $$('.profile-role').forEach(x=>x.textContent=PROFILE.role);
  await loadAll();
  bindForms();
});
async function loadAll(){
  await Promise.all([loadStats(),loadSignals(),loadTrades(),loadCourses(),loadArticles(),loadNotifications(),loadPayments(),loadCommunity(),loadUsers()]);
}
async function safeSelect(table, query='*', apply){
  if(!PSP.sb) return [];
  let q=PSP.sb.from(table).select(query);
  if(apply) q=apply(q);
  const {data,error}=await q;
  if(error){ console.warn(table,error.message); return []; }
  return data||[];
}
async function loadStats(){
  const signals=await safeSelect('signals','id,status,result_pips,created_at');
  const trades=await safeSelect('trades','id,pnl,user_id');
  const users=await safeSelect('profiles','id,role');
  const pending=await safeSelect('payment_requests','id,status',q=>q.eq('status','pending'));
  const map={statSignals:signals.length,statPips:signals.reduce((a,b)=>a+Number(b.result_pips||0),0),statTrades:trades.length,statUsers:users.length,statPending:pending.length};
  Object.entries(map).forEach(([id,v])=>{if($('#'+id)) $('#'+id).textContent=money(v)});
}
async function loadSignals(){
  const data=await safeSelect('signals','*,profiles!signals_author_id_fkey(full_name)',q=>q.order('created_at',{ascending:false}).limit(100));
  const body=$('#signalsBody'); if(!body) return;
  body.innerHTML=data.length?data.map(s=>`<tr><td>${s.symbol||'-'}</td><td><span class="badge ${s.direction==='SELL'?'red':'green'}">${s.direction||'-'}</span></td><td>${s.entry_price??'-'}</td><td>${s.stop_loss??'-'}</td><td>${s.take_profit1??'-'}</td><td>${s.status||'active'}</td><td>${s.result_pips??'-'}</td><td>${s.access_level||'free'}</td></tr>`).join(''):`<tr><td colspan="8" class="empty">No signals yet</td></tr>`;
}
async function loadTrades(){
  const data=await safeSelect('trades','*',q=>q.order('trade_date',{ascending:false}).limit(100));
  const body=$('#tradesBody'); if(!body) return;
  body.innerHTML=data.length?data.map(t=>`<tr><td>${t.symbol||'-'}</td><td>${t.direction||'-'}</td><td>${t.entry_price??'-'}</td><td>${t.exit_price??'-'}</td><td>${t.pnl??0}</td><td>${t.strategy||'-'}</td><td>${t.trade_date||'-'}</td></tr>`).join(''):`<tr><td colspan="7" class="empty">No trades yet</td></tr>`;
}
async function loadCourses(){
  const data=await safeSelect('courses','*',q=>q.eq('is_published',true).order('display_order'));
  const box=$('#courseList'); if(!box)return;
  box.innerHTML=data.length?data.map(c=>`<div class="list-item"><div class="list-item-top"><div><strong>${c.title}</strong><div class="muted">${c.level||'Beginner'} · ${c.category||'General'}</div></div><span class="badge ${c.is_premium?'orange':'green'}">${c.is_premium?'Premium':'Free'}</span></div><p>${c.description||''}</p>${c.youtube_url?`<a class="btn small secondary" target="_blank" href="${c.youtube_url}">Open Lesson</a>`:''}</div>`).join(''):'<div class="empty">No courses yet</div>';
}
async function loadArticles(){
  const data=await safeSelect('articles','*',q=>q.eq('is_published',true).order('created_at',{ascending:false}));
  const box=$('#articleList'); if(!box)return;
  box.innerHTML=data.length?data.map(a=>`<div class="list-item"><strong>${a.title}</strong><div class="muted">${a.category||'Article'} · ${fmtDate(a.created_at)}</div><p>${(a.summary||a.content||'').slice(0,220)}</p></div>`).join(''):'<div class="empty">No articles yet</div>';
}
async function loadNotifications(){
  const data=await safeSelect('notifications','*',q=>q.order('created_at',{ascending:false}).limit(30));
  const box=$('#notificationList'); if(!box)return;
  box.innerHTML=data.length?data.map(n=>`<div class="list-item"><strong>${n.title}</strong><p>${n.message||''}</p><small class="muted">${fmtDate(n.created_at)}</small></div>`).join(''):'<div class="empty">No notifications</div>';
}
async function loadPayments(){
  const data=await safeSelect('payment_requests','*',q=>q.order('created_at',{ascending:false}).limit(100));
  const body=$('#paymentsBody'); if(!body)return;
  body.innerHTML=data.length?data.map(p=>`<tr><td>${p.plan_name||'-'}</td><td>${money(p.amount)} ${p.currency||''}</td><td>${p.method_type||'-'}</td><td><span class="badge ${p.status==='approved'?'green':p.status==='rejected'?'red':'orange'}">${p.status}</span></td><td>${fmtDate(p.created_at)}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">No payment requests</td></tr>';
}
async function loadCommunity(){
  const groups=await safeSelect('groups','*',q=>q.order('is_official',{ascending:false}));
  const box=$('#groupList'); if(!box)return;
  box.innerHTML=groups.length?groups.map(g=>`<div class="list-item"><div class="list-item-top"><strong>${g.name}</strong><span class="badge ${g.is_official?'orange':'green'}">${g.is_official?'Official':'Mentor'}</span></div><p>${g.description||''}</p><small class="muted">${g.members_can_post?'Members can post':'Read only'}</small></div>`).join(''):'<div class="empty">No groups yet</div>';
}
async function loadUsers(){
  const users=await safeSelect('profiles','*',q=>q.order('created_at',{ascending:false}).limit(200));
  const body=$('#usersBody'); if(!body)return;
  body.innerHTML=users.length?users.map(u=>`<tr><td>${u.full_name||'-'}</td><td>${u.email||'-'}</td><td>${u.role||'user'}</td><td>${u.is_premium?'Yes':'No'}</td><td>${u.is_banned?'Banned':'Active'}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">No users</td></tr>';
}
function bindForms(){
  $('#tradeForm')?.addEventListener('submit',async e=>{
    e.preventDefault(); const f=new FormData(e.target);
    const payload=Object.fromEntries(f); payload.user_id=PROFILE.id;
    ['entry_price','exit_price','lot_size','stop_loss','take_profit','pnl'].forEach(k=>payload[k]=payload[k]?Number(payload[k]):null);
    const {error}=await PSP.sb.from('trades').insert(payload); if(error)return toast(error.message); closeModal('tradeModal'); e.target.reset(); toast('Trade added'); loadTrades();loadStats();
  });
  $('#signalForm')?.addEventListener('submit',async e=>{
    e.preventDefault(); const f=new FormData(e.target); const p=Object.fromEntries(f); p.author_id=PROFILE.id; p.direction=p.direction.toUpperCase();
    ['entry_price','stop_loss','take_profit1','take_profit2','take_profit3','take_profit4'].forEach(k=>p[k]=p[k]?Number(p[k]):null);
    const {error}=await PSP.sb.from('signals').insert(p); if(error)return toast(error.message); closeModal('signalModal');e.target.reset();toast('Signal published');loadSignals();loadStats();
  });
  $('#courseForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const p=Object.fromEntries(new FormData(e.target));p.created_by=PROFILE.id;p.is_premium=p.is_premium==='on';p.is_published=true;
    const {error}=await PSP.sb.from('courses').insert(p);if(error)return toast(error.message);closeModal('courseModal');e.target.reset();toast('Course added');loadCourses();
  });
  $('#articleForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const p=Object.fromEntries(new FormData(e.target));p.author_id=PROFILE.id;p.is_published=true;
    const {error}=await PSP.sb.from('articles').insert(p);if(error)return toast(error.message);closeModal('articleModal');e.target.reset();toast('Article published');loadArticles();
  });
  $('#paymentForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const p=Object.fromEntries(new FormData(e.target));p.user_id=PROFILE.id;p.amount=Number(p.amount||0);
    const {error}=await PSP.sb.from('payment_requests').insert(p);if(error)return toast(error.message);closeModal('paymentModal');e.target.reset();toast('Payment request submitted');loadPayments();
  });
  $('#groupForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const p=Object.fromEntries(new FormData(e.target));p.owner_id=PROFILE.id;p.members_can_post=p.members_can_post==='on';p.is_official=PROFILE.role==='admin'&&p.is_official==='on';
    const {error}=await PSP.sb.from('groups').insert(p);if(error)return toast(error.message);closeModal('groupModal');e.target.reset();toast('Group created');loadCommunity();
  });
  $('#notificationForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const p=Object.fromEntries(new FormData(e.target));p.created_by=PROFILE.id;
    const {error}=await PSP.sb.from('notifications').insert(p);if(error)return toast(error.message);closeModal('notificationModal');e.target.reset();toast('Notification published');loadNotifications();
  });
}
