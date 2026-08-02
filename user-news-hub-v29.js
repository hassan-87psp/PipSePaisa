        const NH_PROXY = 'https://pipsepaisa-api.vercel.app/api/news';
        const NH_CATS={conflict:{bg:'rgba(239,68,68,0.12)',c:'var(--red)',l:'⚔️ Conflict',w:['war','strike','attack','military','troops','bomb','missile','killed','wounded','battle','invasion','explosion','coup','rebel','terror','drone','army','shooting','hostage','airstrike','shelling']},geopolitics:{bg:'rgba(139,92,246,0.12)',c:'var(--purple)',l:'🌍 Geopolitics',w:['geopolit','nato','sanction','diplomatic','foreign policy','alliance','treaty','un security','g7','g20','territorial','nuclear deal','peace talks','ceasefire','strait','blockade','embargo']},forex:{bg:'rgba(245,158,11,0.12)',c:'var(--gold)',l:'💹 Forex',w:['forex','xau/usd','xauusd','eurusd','gbpusd','usdjpy','gold price','currency','dollar index','pip','spread','fx market','forexlive','fxstreet','exchange rate']},fundamental:{bg:'rgba(20,184,166,0.12)',c:'#14b8a6',l:'📊 Fundamental',w:['gdp','inflation','cpi','ppi','nonfarm','interest rate','federal reserve','fed rate','central bank','monetary policy','rate hike','rate cut','fomc','ecb','boe','unemployment','jobs report','retail sales']},usnews:{bg:'rgba(236,72,153,0.12)',c:'#ec4899',l:'🇺🇸 US News',w:['trump','biden','white house','congress','senate','us economy','federal','pentagon','wall street','new york','california','washington dc','republican','democrat','tariff']},political:{bg:'rgba(59,130,246,0.12)',c:'var(--blue)',l:'🏛️ Political',w:['president','parliament','election','vote','government','minister','prime minister','summit','policy','political','ruling party','opposition']},disaster:{bg:'rgba(249,115,22,0.12)',c:'var(--orange)',l:'🌪️ Disaster',w:['earthquake','flood','hurricane','cyclone','tsunami','storm','wildfire','drought','eruption','disaster','emergency','rescue','evacuate','death toll','tornado']},economic:{bg:'rgba(16,185,129,0.12)',c:'var(--green)',l:'💰 Economic',w:['economy','market','stock','oil price','crude','opec','budget','fiscal','imf','world bank','trade deal','recession']}};
        let nhNews=[],nhFilter='all',nhFetching=false;
        let nhKws=JSON.parse(localStorage.getItem('nhKws')||'["Iran","Gold","Trump","War","Fed"]');
        let nhNotifOn=false,nhSeen=new Set(),nhFirstLoad=true;

        function nhCls(t,d){const tx=(t+' '+d).toLowerCase();const o=['forex','fundamental','usnews','geopolitics','conflict','disaster','political','economic'];for(const c of o){if(NH_CATS[c].w.some(w=>tx.includes(w)))return c;}return'political';}
        function nhSevFn(t,d,cat){const tx=(t+' '+d).toLowerCase();const h=['killed','dead','explosion','attack','strike','crisis','massive','critical'];const m=['injured','conflict','tension','warning'];if(['conflict','disaster'].includes(cat)){if(h.filter(w=>tx.includes(w)).length>=2)return'S4';if(h.some(w=>tx.includes(w)))return'S3';if(m.some(w=>tx.includes(w)))return'S2';return'S1';}if(h.some(w=>tx.includes(w)))return'S2';return'S1';}
        function nhLoc(t,d){const pl=['Ukraine','Russia','Iran','Israel','Gaza','Syria','Iraq','China','Taiwan','North Korea','Pakistan','India','Washington','London','France','Germany','Turkey','Saudi Arabia','Yemen','Sudan','Libya','Afghanistan','Somalia','Panama','Mexico','Japan','South Korea','NATO'];const tx=t+' '+d;for(const p of pl)if(tx.includes(p))return p;return'Global';}
        function nhAgo(d){const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' hr ago';return Math.floor(s/86400)+'d ago';}

        async function nhLoad(){
          if(nhFetching)return;nhFetching=true;
          const btn=document.getElementById('nhRefBtn');if(btn){btn.disabled=true;btn.textContent='⏳';}
          document.getElementById('nhList').innerHTML='<div class="nh-loading"><div class="nh-spin"></div>Fetching live news...</div>';
          try{
            const r=await fetch(NH_PROXY,{signal:AbortSignal.timeout(9000)});
            const d=await r.json();
            if(!d.success||!d.items?.length)throw new Error(d.error||'No data');
            nhNews=d.items.map(n=>({...n,cat:nhCls(n.title,n.desc),sv:nhSevFn(n.title,n.desc,nhCls(n.title,n.desc)),lc:nhLoc(n.title,n.desc),id:n.title.slice(0,40).replace(/[^a-zA-Z0-9]/g,'').toLowerCase()}));
            nhNews.forEach(n=>{if(!nhSeen.has(n.id)){const fresh=!nhFirstLoad;nhSeen.add(n.id);if(fresh)nhCheckNotif(n);}});nhFirstLoad=false;
            const now=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
            const el=document.getElementById('nhLastUp');if(el)el.textContent='Updated '+now;
            nhUpdateStats();nhRender();nhRenderForex();nhUpdateImpact();
          }catch(e){
            document.getElementById('nhList').innerHTML=`<div class="nh-err" style="margin:12px">❌ Could not load news<br><small style="opacity:.7">${e.message}</small></div>`;
          }finally{
            nhFetching=false;if(btn){btn.disabled=false;btn.textContent='🔄 Refresh';}
          }
        }

        function nhUpdateStats(){
          const s=id=>{const el=document.getElementById(id);if(el)el.textContent=nhNews.filter(n=>n.cat===id.replace('nhS','').toLowerCase()).length;};
          const ec=document.getElementById('nhEC');if(ec)ec.textContent=nhNews.length;
          ['nhSC','nhSG','nhSF','nhSU'].forEach(id=>{
            const map={nhSC:'conflict',nhSG:'geopolitics',nhSF:'forex',nhSU:'usnews'};
            const el=document.getElementById(id);if(el)el.textContent=nhNews.filter(n=>n.cat===map[id]).length;
          });
        }

        async function nhUpdateImpact(){
          // 1) AI-analyzed impact (shared cache in Supabase, 30 min fresh) — fallback: keyword scoring
          try{
            const db=(typeof sb!=='undefined'&&sb)?sb:null;
            let cached=null;
            if(db){
              const r=await db.from('nh_impact_cache').select('data,updated_at').eq('id',1).maybeSingle();
              if(r&&r.data&&r.data.data&&r.data.updated_at&&(Date.now()-new Date(r.data.updated_at).getTime())<30*60*1000){cached=r.data.data;}
            }
            if(!cached){
              const heads=(nhNews||[]).slice(0,15).map(n=>'- '+(n.title||'')).join('\n');
              if(heads.length>40){
                const prompt='You are a forex analyst. Based ONLY on these news headlines, give the likely impact on each instrument. Reply with STRICT JSON only, no markdown, exactly this shape: {"XAU/USD":{"bias":"bullish|bearish|neutral","why":"2-4 words"},"EUR/USD":{...},"USD/JPY":{...},"USD Index":{...},"Oil (WTI)":{...}}\nHeadlines:\n'+heads;
                const rr=await fetch('https://pipsepaisa-api.vercel.app/api/ai-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:prompt}),signal:AbortSignal.timeout(15000)});
                if(rr.ok){
                  const dd=await rr.json();
                  let txt=(dd.report||'').replace(/```json|```/g,'').trim();
                  const m=txt.match(/\{[\s\S]*\}/);
                  if(m){cached=JSON.parse(m[0]);
                    if(db){try{await db.from('nh_impact_cache').upsert({id:1,data:cached,updated_at:new Date().toISOString()});}catch(e){}}
                  }
                }
              }
            }
            if(cached){
              const el2=document.getElementById('nhImpact');if(!el2)return;
              const ic={bullish:'▲ Bullish',bearish:'▼ Bearish',neutral:'— Neutral'};
              const cl={bullish:'nh-bull',bearish:'nh-bear',neutral:'nh-neut'};
              el2.innerHTML=['XAU/USD','EUR/USD','USD/JPY','USD Index','Oil (WTI)'].map(function(pr){
                const o=cached[pr]||{};const b=(o.bias||'neutral').toLowerCase();
                const why=(o.why&&b!=='neutral')?(' — '+o.why):'';
                return '<div class="nh-impact-row"><span style="font-weight:700;color:var(--text-secondary)">'+pr+'</span><span class="'+(cl[b]||'nh-neut')+'">'+((ic[b]||'— Neutral')+why)+'</span></div>';
              }).join('');
              return;
            }
          }catch(e){console.warn('AI impact fallback:',e);}
          // 2) Fallback: keyword scoring
          const T=(nhNews||[]).map(n=>((n.title||'')+' '+(n.desc||'')).toLowerCase());
          const hits=w=>T.filter(t=>t.includes(w)).length;
          const sum=ws=>ws.reduce((a,w)=>a+hits(w),0);
          const conflict=sum(['war','strike','attack','missile','airstrike','conflict','military','troops']);
          const mideast=sum(['iran','israel','gaza','saudi','yemen','hormuz','hezbollah']);
          const ukr=sum(['ukraine','russia','kremlin']);
          const fedUp=sum(['rate hike','hawkish','hot inflation','inflation rises','strong jobs','jobs beat','yields rise']);
          const fedDown=sum(['rate cut','dovish','inflation cools','cooling inflation','weak jobs','recession','jobless claims rise']);
          const trade=sum(['tariff','trade war','sanction','export ban']);
          const oilSup=sum(['opec','oil supply','pipeline','embargo','output cut']);
          const goldS=conflict+mideast+ukr+fedDown-fedUp;
          const eurS=fedDown-(trade+fedUp);
          const jpyS=-(conflict+mideast+ukr);
          const dxyS=fedUp+trade+Math.floor((conflict+mideast)/3)-fedDown;
          const oilS=mideast+ukr+oilSup;
          const row=(pair,sc,bw,brw)=>{const cls=sc>1?'nh-bull':(sc<-1?'nh-bear':'nh-neut');const txt=sc>1?('▲ Bullish — '+bw):(sc<-1?('▼ Bearish — '+brw):'— Neutral');return '<div class="nh-impact-row"><span style="font-weight:700;color:var(--text-secondary)">'+pair+'</span><span class="'+cls+'">'+txt+'</span></div>';};
          const el=document.getElementById('nhImpact');if(!el)return;
          el.innerHTML=
            row('XAU/USD',goldS,'Risk-off / safe haven','Hawkish Fed')+
            row('EUR/USD',eurS,'Dovish Fed','Trade war / strong USD')+
            row('USD/JPY',jpyS,'Risk-on flows','Safe haven JPY')+
            row('USD Index',dxyS,'Hawkish Fed / geopolitics','Dovish Fed')+
            row('Oil (WTI)',oilS,'Supply risk','Demand worries');
        }

        function nhRender(){
          const items=nhFilter==='all'?nhNews:nhNews.filter(n=>n.cat===nhFilter);
          const el=document.getElementById('nhList');if(!el)return;
          if(!items.length){el.innerHTML='<div class="nh-loading">No news in this category</div>';return;}
          el.innerHTML=items.map((item)=>{
            const idx=nhNews.indexOf(item);const s=NH_CATS[item.cat]||NH_CATS.political;
            return`<div class="nh-nitem" onclick="nhDetail(${idx})" id="nhni${idx}">
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;flex-wrap:wrap">
                <span class="nh-cat" style="background:${s.bg};color:${s.c}">${s.l}</span>
                <span class="nh-sev nh-${item.sv.toLowerCase()}">${item.sv}</span>
                <span style="margin-left:auto;font-size:9px;color:var(--text-muted)">${nhAgo(item.date)}</span>
              </div>
              <div style="font-size:12px;font-weight:600;line-height:1.4;margin-bottom:4px;color:var(--text-primary)">${item.title}</div>
              <div style="font-size:10px;color:var(--text-muted);display:flex;gap:4px">📍 ${item.lc}<span style="margin-left:auto">${item.source}</span></div>
            </div>`;
          }).join('');
        }

        function nhRenderForex(){
          const pairs=['XAU/USD','EUR/USD','USD/JPY','GBP/USD','USD/CAD','AUD/USD'];
          const items=nhNews.filter(n=>n.cat==='forex'||n.cat==='fundamental').slice(0,4);
          const el=document.getElementById('nhForex');if(!el)return;
          if(!items.length){el.innerHTML='<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:10px">No forex news yet</div>';return;}
          el.innerHTML=items.map((n,i)=>`<div class="nh-fcard" onclick="nhDetail(${nhNews.indexOf(n)})"><div style="font-size:10px;font-weight:700;color:var(--text-muted);margin-bottom:4px">${pairs[i%6]}</div><div style="font-size:12px;color:var(--text-primary);line-height:1.3">${n.title.slice(0,65)}...</div><div style="font-size:10px;color:var(--text-muted);margin-top:4px">${nhAgo(n.date)} · ${n.source}</div></div>`).join('');
        }

        function nhDetailHTML(n,s){
          return `
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:12px;flex-wrap:wrap">
              <span class="nh-cat" style="background:${s.bg};color:${s.c};font-size:10px;padding:3px 10px">${s.l}</span>
              <span class="nh-sev nh-${n.sv.toLowerCase()}" style="font-size:10px">${n.sv}</span>
              <span style="margin-left:auto;font-size:10px;color:var(--text-muted)">${nhAgo(n.date)} · ${n.source}</span>
            </div>
            <div style="font-size:16px;font-weight:700;line-height:1.3;margin-bottom:8px;color:var(--text-primary)">${n.title}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;display:flex;gap:12px;flex-wrap:wrap"><span>📍 ${n.lc}</span><span>🕐 ${new Date(n.date).toLocaleString()}</span></div>
            ${n.desc?`<div style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:14px">${n.desc}...</div>`:''}
            <a href="${n.link}" target="_blank" class="btn btn-primary" style="font-size:13px">Read Full Story ↗</a>`;
        }

        // Mobile inline: headline/badge/location are already shown in the list row above,
        // so show ONLY the extra info (exact time + description + read link) — no duplication.
        function nhDetailInlineHTML(n){
          return `
            <div style="font-size:10.5px;color:var(--text-muted);margin-bottom:10px;display:flex;gap:14px;flex-wrap:wrap">
              <span>🕐 ${new Date(n.date).toLocaleString()}</span><span>📰 ${n.source}</span>
            </div>
            ${n.desc?`<div style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:14px">${n.desc}...</div>`:'<div style="font-size:12px;color:var(--text-muted);margin-bottom:14px">Open the full story for more details.</div>'}
            <a href="${n.link}" target="_blank" class="btn btn-primary" style="font-size:13px">Read Full Story ↗</a>`;
        }

        function nhDetail(idx){
          const n=nhNews[idx];if(!n)return;
          const s=NH_CATS[n.cat]||NH_CATS.political;
          const isMobile=window.matchMedia('(max-width:820px)').matches;

          if(isMobile){
            // ----- MOBILE: expand detail inline, right under the tapped news -----
            const item=document.getElementById('nhni'+idx);if(!item)return;
            const existing=document.getElementById('nhInlineDetail');
            const wasOpenHere=existing && existing.dataset.idx===String(idx);
            if(existing) existing.remove();
            document.querySelectorAll('[id^="nhni"]').forEach(e=>e.classList.remove('active'));
            // tapping the same open item again -> just collapse
            if(wasOpenHere) return;
            item.classList.add('active');
            const box=document.createElement('div');
            box.id='nhInlineDetail';box.dataset.idx=idx;box.className='nh-inline-detail';
            box.style.cssText=`border-left:3px solid ${s.c};background:var(--bg-elevated);padding:14px;animation:fadeIn .2s`;
            box.innerHTML=nhDetailInlineHTML(n);
            item.insertAdjacentElement('afterend',box);
            // keep the tapped headline at the top so the detail is visible right away
            setTimeout(()=>item.scrollIntoView({behavior:'smooth',block:'start'}),30);
            return;
          }

          // ----- DESKTOP: fill the right-side panel (unchanged) -----
          document.querySelectorAll('[id^="nhni"]').forEach(e=>e.classList.remove('active'));
          const el=document.getElementById('nhni'+idx);if(el){el.classList.add('active');el.scrollIntoView({block:'nearest'});}
          const d=document.getElementById('nhDetail');if(!d)return;
          d.innerHTML=nhDetailHTML(n,s);
        }

        function nhSetFilter(cat,el){nhFilter=cat;document.querySelectorAll('.nh-tab').forEach(t=>t.classList.remove('active'));if(el)el.classList.add('active');nhRender();}
        function nhToggleNotif(){const p=document.getElementById('nhNotifPanel');if(p)p.style.display=p.style.display==='none'?'block':'none';nhRenderNotif();}
        function nhRenderNotif(){const chips=nhKws.map((kw,i)=>`<span class="nh-kw-chip">${kw}<button onclick="nhRemoveKw(${i})">×</button></span>`).join('');const el=document.getElementById('nhKwChips');if(el)el.innerHTML=chips;const status=document.getElementById('nhNotifStatus');if(status&&Notification.permission==='granted'){status.innerHTML='<span style="color:var(--green);font-size:12px">✅ Notifications enabled</span>';nhNotifOn=true;}}
        function nhAddKw(){const inp=document.getElementById('nhKwInput');if(!inp)return;const v=inp.value.trim();if(v&&!nhKws.includes(v)){nhKws.push(v);localStorage.setItem('nhKws',JSON.stringify(nhKws));inp.value='';nhRenderNotif();}}
        function nhRemoveKw(i){nhKws.splice(i,1);localStorage.setItem('nhKws',JSON.stringify(nhKws));nhRenderNotif();}
        async function nhRequestNotif(){const p=await Notification.requestPermission();if(p==='granted')nhNotifOn=true;nhRenderNotif();}
        function nhCheckNotif(item){const tx=(item.title+' '+item.desc).toLowerCase();const match=nhKws.some(kw=>tx.includes(kw.toLowerCase()));if(!match)return;nhShowToast(item);if(Notification.permission==='granted'){try{new Notification('📡 '+item.title.slice(0,80),{body:item.source,tag:item.id});}catch(e){}}}
        function nhShowToast(item){const s=NH_CATS[item.cat]||NH_CATS.political;const tc=document.getElementById('nhToasts');if(!tc)return;if(!document.getElementById('nhClearBtn')){const cb=document.createElement('button');cb.id='nhClearBtn';cb.textContent='✕ Clear all';cb.style.cssText='pointer-events:all;cursor:pointer;align-self:flex-end;background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-primary);font-size:11px;font-weight:700;padding:5px 10px;border-radius:8px;font-family:inherit';cb.onclick=nhClearToasts;tc.appendChild(cb);}const t=document.createElement('div');t.className='nh-toast';t.style.cssText=`background:var(--bg-card);border:1px solid var(--border);border-left:3px solid ${s.c};border-radius:10px;padding:12px 14px;pointer-events:all;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4)`;t.innerHTML=`<div style="font-size:9px;font-weight:800;text-transform:uppercase;color:${s.c};margin-bottom:4px">${s.l}</div><div style="font-size:12px;font-weight:600;line-height:1.4;color:var(--text-primary)">${item.title.slice(0,90)}</div><div style="font-size:10px;color:var(--text-muted);margin-top:3px">${item.source}</div>`;t.onclick=()=>{t.remove();nhMaybeHideClear();};tc.appendChild(t);const all=Array.prototype.slice.call(tc.querySelectorAll('.nh-toast'));while(all.length>3){all.shift().remove();}setTimeout(()=>{t.remove();nhMaybeHideClear();},8000);}
        function nhClearToasts(){const tc=document.getElementById('nhToasts');if(tc)tc.innerHTML='';}
        function nhMaybeHideClear(){const tc=document.getElementById('nhToasts');if(tc&&!tc.querySelector('.nh-toast')){const cb=document.getElementById('nhClearBtn');if(cb)cb.remove();}}

        let nhLoaded=false;
        window.nhInitLoad=function(){if(!nhLoaded){nhLoaded=true;nhLoad();setInterval(nhLoad,5*60*1000);}};
        