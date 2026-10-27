        const NH_PROXY = 'https://pipsepaisa-api.vercel.app/api/news';
        const NH_CATS={conflict:{bg:'rgba(239,68,68,0.12)',c:'var(--red)',l:'⚔️ Conflict',w:['war','strike','attack','military','troops','bomb','missile','killed','wounded','battle','invasion','explosion','coup','rebel','terror','drone','army','shooting','hostage','airstrike','shelling']},geopolitics:{bg:'rgba(139,92,246,0.12)',c:'var(--purple)',l:'🌍 Geopolitics',w:['geopolit','nato','sanction','diplomatic','foreign policy','alliance','treaty','un security','g7','g20','territorial','nuclear deal','peace talks','ceasefire','strait','blockade','embargo']},forex:{bg:'rgba(245,158,11,0.12)',c:'var(--gold)',l:'💹 Forex',w:['forex','xau/usd','xauusd','eurusd','gbpusd','usdjpy','gold price','currency','dollar index','pip','spread','fx market','forexlive','fxstreet','exchange rate']},fundamental:{bg:'rgba(20,184,166,0.12)',c:'#14b8a6',l:'📊 Fundamental',w:['gdp','inflation','cpi','ppi','nonfarm','interest rate','federal reserve','fed rate','central bank','monetary policy','rate hike','rate cut','fomc','ecb','boe','unemployment','jobs report','retail sales']},usnews:{bg:'rgba(236,72,153,0.12)',c:'#ec4899',l:'🇺🇸 US News',w:['trump','biden','white house','congress','senate','us economy','federal','pentagon','wall street','new york','california','washington dc','republican','democrat','tariff']},political:{bg:'rgba(59,130,246,0.12)',c:'var(--blue)',l:'🏛️ Political',w:['president','parliament','election','vote','government','minister','prime minister','summit','policy','political','ruling party','opposition']},disaster:{bg:'rgba(249,115,22,0.12)',c:'var(--orange)',l:'🌪️ Disaster',w:['earthquake','flood','hurricane','cyclone','tsunami','storm','wildfire','drought','eruption','disaster','emergency','rescue','evacuate','death toll','tornado']},economic:{bg:'rgba(16,185,129,0.12)',c:'var(--green)',l:'💰 Economic',w:['economy','market','stock','oil price','crude','opec','budget','fiscal','imf','world bank','trade deal','recession']}};
        let nhNews=[],nhFilter='focus',nhHeatFilter='all',nhFetching=false,nhSelectedStory=null;
        let nhKws=JSON.parse(localStorage.getItem('nhKws')||'["Iran","Gold","Trump","War","Fed"]');
        let nhNotifOn=false,nhSeen=new Set(),nhFirstLoad=true;

        function nhCls(t,d){const tx=(t+' '+d).toLowerCase();const o=['forex','fundamental','usnews','geopolitics','conflict','disaster','political','economic'];for(const c of o){if(NH_CATS[c].w.some(w=>tx.includes(w)))return c;}return'political';}
        function nhCategoryForItem(n){
          const found=nhCls(n.title||'',n.desc||'');
          const mapping={Forex:'forex',Gold:'forex',Macro:'fundamental','Central Banks':'fundamental',Markets:'economic',Crypto:'economic',Geopolitics:'geopolitics','US News':'usnews',Energy:'economic'};
          return found==='political' ? (mapping[n.category]||found) : found;
        }
        function nhAgo(d){const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' hr ago';return Math.floor(s/86400)+'d ago';}


        // Headline-based potential market sensitivity, NOT age or confirmed price reaction.
        // Backend grades from published title only. Fail closed to COLD when data is missing.
        function nhHeatInfo(article){
          const value=article&&typeof article==='object'?article.heat:null;
          const key=['hot','warm','cold'].includes(value)?value:'cold';
          const labels={
            hot:{key:'hot',label:'🔥 HOT',detail:'Potentially major Gold, USD or FX market-moving event. Headline classification, not confirmed market impact.'},
            warm:{key:'warm',label:'☀️ WARM',detail:'Relevant economic or policy news, preview or commentary. Market reaction not confirmed.'},
            cold:{key:'cold',label:'❄️ COLD',detail:'Routine or less-directly relevant news. Not a measured market reaction.'}
          };
          return labels[key];
        }
        function nhHeatBadge(article){
          const v=nhHeatInfo(article),info=article&&article.heatReason?String(article.heatReason):'';
          return '<span class="nh-heat nh-heat-'+v.key+'" title="'+nhEsc(v.detail+(info?' '+info:''))+'">'+v.label+'</span>';
        }
        function nhSetHeatFilter(level,button){
          nhHeatFilter=['all','hot','warm','cold'].includes(level)?level:'all';
          document.querySelectorAll('.nh-heat-btn').forEach(b=>{
            const active=b.dataset.heat===nhHeatFilter;
            b.classList.toggle('active',active);
            b.setAttribute('aria-pressed',active?'true':'false');
          });
          nhRender();
        }


        async function nhLoad(){
          if(nhFetching)return;nhFetching=true;
          const btn=document.getElementById('nhRefBtn');if(btn){btn.disabled=true;btn.textContent='⏳';}
          if(!nhNews.length)document.getElementById('nhList').innerHTML='<div class="nh-loading"><div class="nh-spin"></div>Fetching live news...</div>';
          try{
            const r=await fetch(NH_PROXY,{signal:AbortSignal.timeout(12000)});
            const d=await r.json();
            if(!d.success||!d.items?.length)throw new Error(d.error||'No data');
            nhNews=d.items.map(n=>({...n,cat:nhCategoryForItem(n),id:n.title.slice(0,40).replace(/[^a-zA-Z0-9]/g,'').toLowerCase()}));
            nhNews.forEach(n=>{if(!nhSeen.has(n.id)){const fresh=!nhFirstLoad;nhSeen.add(n.id);if(fresh)nhCheckNotif(n);}});nhFirstLoad=false;
            const now=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
            const el=document.getElementById('nhLastUp');if(el){const active=Number(d.sources), configured=Number(d.configured);el.textContent='Updated '+now+(Number.isFinite(active)&&Number.isFinite(configured)&&configured>0?' · '+active+'/'+configured+' feeds':'');}
            nhUpdateStats();nhRender();nhRenderForex();
            if(nhSelectedStory && !window.matchMedia('(max-width:820px)').matches){
              const idx=nhNews.findIndex(n=>(n.link||n.url||n.title)===nhSelectedStory);
              const detail=document.getElementById('nhDetail');
              if(idx>=0 && detail){
                const n=nhNews[idx];detail.innerHTML=nhDetailHTML(n,NH_CATS[n.cat]||NH_CATS.political);nhUpdateImpact(n);
                const row=document.getElementById('nhni'+idx);if(row)row.classList.add('active');
              }else if(detail){
                nhSelectedStory=null;detail.innerHTML='<div class="nh-loading">Select a headline to view its details.</div>';nhUpdateImpact(null);
              }
            }
          }catch(e){
            if(!nhNews.length)document.getElementById('nhList').innerHTML=`<div class="nh-err" style="margin:12px">❌ Could not load news<br><small style="opacity:.7">${e.message}</small></div>`;
            else console.warn('News refresh failed; showing previous headlines',e);
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

        function nhEsc(x){return String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
        // This panel refers ONLY to the selected headline, never the overall market.
        // No directional statement without time-matched observed price candles.
        let nhReactionSequence=0;
        function nhReactionBadge(label){
          const colors={
            'Strong Positive':['▲▲','#065f46','rgba(5,150,105,.14)'],
            'Positive':['▲','#15803d','rgba(22,163,74,.10)'],
            'Neutral':['●','#64748b','rgba(100,116,139,.10)'],
            'Negative':['▼','#dc2626','rgba(239,68,68,.10)'],
            'Strong Negative':['▼▼','#991b1b','rgba(220,38,38,.14)']
          };
          const v=colors[label];
          if(!v)return '<span class="nh-neut">Not verified</span>';
          return '<span style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap;border-radius:6px;'+
            'padding:5px 7px;font-size:10px;font-weight:800;color:'+v[1]+';background:'+v[2]+'">'+v[0]+' '+nhEsc(label)+'</span>';
        }
        async function nhUpdateImpact(article){
          const el=document.getElementById('nhImpact');if(!el)return;
          const seq=++nhReactionSequence;
          if(!article){el.innerHTML='<div class="nh-impact-row nh-neut">Select a headline to check its 30-minute market reaction.</div>';return;}
          el.innerHTML='<div class="nh-impact-row nh-neut">Checking the published-time market move...</div>';
          try{
            const params=new URLSearchParams({title:article.title||'',at:article.date||''});
            const r=await fetch('https://pipsepaisa-api.vercel.app/api/news-reaction?'+params.toString(),{signal:AbortSignal.timeout(9500)});
            if(!r.ok)throw Error('Source unavailable');
            const d=await r.json();
            if(seq!==nhReactionSequence)return;
            if(d.status!=='observed'||!Array.isArray(d.observations)||!d.observations.length){
              const descriptions={
                not_applicable:'No directly named market instrument. No impact claimed.',
                pending:'30-minute post-publication observation is not complete yet.',
                unavailable:'No verified 30-minute price observations for this news.'
              };
              el.innerHTML='<div style="padding:12px 14px;font-size:11px;color:var(--text-muted);line-height:1.5">'+
                nhEsc(descriptions[d.status]||'Impact cannot be verified.')+'</div>';
              return;
            }
            el.innerHTML=d.observations.map(o=>
              '<div class="nh-impact-row" style="gap:8px">'+
              '<span style="font-weight:700;color:var(--text-secondary)">'+nhEsc(o.instrument)+'</span>'+
              nhReactionBadge(o.sentiment)+'</div>'
            ).join('')+
              '<div style="padding:9px 14px;font-size:10px;color:var(--text-muted);line-height:1.45">'+
              'Observed price move in 30 minutes after publication · Yahoo Finance (may be delayed). '+
              'Movement does not prove the news caused it.</div>';
          }catch(e){
            if(seq===nhReactionSequence)el.innerHTML='<div class="nh-impact-row nh-neut">Verified data unavailable. No sign shown.</div>';
          }
        }

        function nhRender(){
          const categoryItems=nhFilter==='all'?nhNews:nhFilter==='focus'?nhNews.filter(n=>n.marketFocus===true):nhFilter==='bloomberg'?nhNews.filter(n=>/bloomberg/i.test(n.source||'')):nhNews.filter(n=>n.cat===nhFilter);
          const items=nhHeatFilter==='all'?categoryItems:categoryItems.filter(n=>nhHeatInfo(n).key===nhHeatFilter);
          const el=document.getElementById('nhList');if(!el)return;
          const count=document.getElementById('nhEC');if(count)count.textContent=items.length;
          if(!items.length){el.innerHTML='<div class="nh-loading">'+(nhFilter==='focus'?'No recent trading-related headlines verified. Choose All for other news.':'No news matches these filters')+'</div>';return;}
          el.innerHTML=items.map((item)=>{
            const idx=nhNews.indexOf(item);const s=NH_CATS[item.cat]||NH_CATS.political;
            return`<div class="nh-nitem${nhSelectedStory===(item.link||item.url||item.title)?' active':''}" onclick="nhDetail(${idx})" id="nhni${idx}">
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;flex-wrap:wrap">
                <span class="nh-cat" style="background:${s.bg};color:${s.c}">${s.l}</span>
                ${nhHeatBadge(item)}
                ${nhFilter==='all'&&item.marketFocus?'<span class="nh-focus-tag">⚡ Market Focus</span>':''}
                <span style="margin-left:auto;font-size:9px;color:var(--text-muted)">${nhAgo(item.date)}</span>
              </div>
              <div style="font-size:12px;font-weight:600;line-height:1.4;margin-bottom:4px;color:var(--text-primary)">${nhEsc(item.title)}</div>
              <div style="font-size:10px;color:var(--text-muted);display:flex;gap:4px">📰 ${nhEsc(item.source)}</div>
            </div>`;
          }).join('');
        }

        // Show an instrument only when explicitly mentioned in the headline.
        function nhHeadlineSubject(t){
          t=String(t||'');
          if(/\b(?:xau\s*\/?\s*usd|gold|bullion)\b/i.test(t))return'Gold';
          if(/\b(?:xag\s*\/?\s*usd|silver)\b/i.test(t))return'Silver';
          const pairs=['EUR/USD','GBP/USD','USD/JPY','USD/CAD','AUD/USD','NZD/USD'];
          for(const p of pairs)if(new RegExp('\\b'+p.replace('/','\\s*\\/?\\s*')+'\\b','i').test(t))return p;
          if(/\b(?:bitcoin|btc)\b/i.test(t))return'Bitcoin';
          if(/\b(?:oil|crude|brent|wti)\b/i.test(t))return'Crude Oil';
          if(/\b(?:dxy|dollar index|us dollar index)\b/i.test(t))return'USD Index';
          if(/\b(?:forex|foreign exchange|fx markets?|currencies|currency markets?)\b/i.test(t))return'Forex Market';
          if(/\b(?:fed|fomc|ecb|boe|boj|cpi|ppi|pce|nfp|payroll|inflation|gdp|unemployment|jobs report|central bank|interest rates?|monetary policy|retail sales)\b/i.test(t))return'Macro News';
          return null;
        }
        function nhRenderForex(){
          const el=document.getElementById('nhForex');if(!el)return;
          const items=nhNews.filter(n=>['forex','fundamental'].includes(n.cat)&&nhHeadlineSubject(n.title)).slice(0,6);
          if(!items.length){el.innerHTML='<div class="nh-loading">No explicitly matched forex/macro headlines</div>';return;}
          el.innerHTML=items.map(n=>'<div class="nh-fcard" onclick="nhDetail('+nhNews.indexOf(n)+')">'+
            '<div style="font-size:10px;font-weight:700;color:var(--text-muted);margin-bottom:4px">'+nhEsc(nhHeadlineSubject(n.title))+'</div>'+
            '<div style="font-size:12px;color:var(--text-primary);line-height:1.3">'+nhEsc(n.title.slice(0,100))+'</div>'+
            '<div style="font-size:10px;color:var(--text-muted);margin-top:4px">'+nhEsc(nhAgo(n.date))+' · '+nhEsc(n.source)+'</div></div>').join('');
        }

        function nhDetailHTML(n,s){
          return `
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:12px;flex-wrap:wrap">
              <span class="nh-cat" style="background:${s.bg};color:${s.c};font-size:10px;padding:3px 10px">${s.l}</span>
              ${nhHeatBadge(n)}
              <span style="margin-left:auto;font-size:10px;color:var(--text-muted)">${nhAgo(n.date)} · ${n.source}</span>
            </div>
            <div style="font-size:16px;font-weight:700;line-height:1.3;margin-bottom:8px;color:var(--text-primary)">${nhEsc(n.title)}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;display:flex;gap:12px;flex-wrap:wrap"><span>🕐 ${new Date(n.date).toLocaleString()}</span></div>
            ${n.desc?`<div style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:14px">${nhEsc(n.desc)}...</div>`:''}
            <a href="${nhEsc(n.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="font-size:13px">Read This Story ↗</a>`;
        }

        // Mobile inline: headline/badge/location are already shown in the list row above,
        // so show ONLY the extra info (exact time + description + read link) — no duplication.
        function nhDetailInlineHTML(n){
          return `
            <div style="font-size:10.5px;color:var(--text-muted);margin-bottom:10px;display:flex;gap:14px;flex-wrap:wrap">
              <span>🕐 ${new Date(n.date).toLocaleString()}</span><span>📰 ${n.source}</span>
            </div>
            ${n.desc?`<div style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:14px">${nhEsc(n.desc)}...</div>`:'<div style="font-size:12px;color:var(--text-muted);margin-bottom:14px">Open the full story for more details.</div>'}
            <a href="${nhEsc(n.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="font-size:13px">Read This Story ↗</a>`;
        }

        function nhDetail(idx){
          const n=nhNews[idx];if(!n)return;
          nhSelectedStory=n.link||n.url||n.title;
          nhUpdateImpact(n);
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
        function nhRenderNotif(){
          const chips=nhKws.map((kw,i)=>'<span class="nh-kw-chip">'+nhEsc(kw)+'<button onclick="nhRemoveKw('+i+')">×</button></span>').join('');
          const el=document.getElementById('nhKwChips');if(el)el.innerHTML=chips;
          const status=document.getElementById('nhNotifStatus');
          const state=typeof window.pspPushGetState==='function'?window.pspPushGetState():'off';
          nhNotifOn=state==='on';
          if(status){
            const messages={
              on:'<span style="color:var(--green);font-size:12px">✅ OneSignal push subscribed on this device</span>',
              checking:'<span style="font-size:12px;color:var(--text-muted)">⏳ Checking device subscription...</span>',
              blocked:'<span style="font-size:12px;color:var(--red)">Notifications blocked in browser settings</span>',
              'ios-install':'<span style="font-size:12px;color:var(--text-muted)">Install to Home Screen to enable iPhone push</span>',
              unsupported:'<span style="font-size:12px;color:var(--text-muted)">Push unsupported on this device</span>',
              off:'<span style="font-size:12px;color:var(--text-muted)">Not subscribed for background push alerts</span>'
            };
            status.innerHTML=messages[state]||messages.off;
          }
        }
        function nhAddKw(){const inp=document.getElementById('nhKwInput');if(!inp)return;const v=inp.value.trim();if(v&&!nhKws.includes(v)){nhKws.push(v);localStorage.setItem('nhKws',JSON.stringify(nhKws));inp.value='';nhRenderNotif();}}
        function nhRemoveKw(i){nhKws.splice(i,1);localStorage.setItem('nhKws',JSON.stringify(nhKws));nhRenderNotif();}
        async function nhRequestNotif(){
          if(typeof window.pspPushSubscribe!=='function'){
            const status=document.getElementById('nhNotifStatus');
            if(status)status.textContent='Notification service not loaded. Refresh and try again.';
            return;
          }
          const result=await window.pspPushSubscribe();
          nhRenderNotif();
          if(!result?.ok){
            const status=document.getElementById('nhNotifStatus');
            if(status)status.textContent=result?.message||'Could not register this device for push alerts.';
          }
        }
        window.addEventListener('psp:push-subscribed',nhRenderNotif);
        function nhCheckNotif(item){
          // Client popups only for HOT stories. The server sends push to subscribed
          // devices; do not create a second native Notification for the same story.
          if(!item||item.heat!=='hot')return;
          const tx=(item.title+' '+(item.desc||'')).toLowerCase();
          const match=nhKws.some(kw=>tx.includes(String(kw).toLowerCase()));
          if(!match)return;
          nhShowToast(item);
          const serverSubscribed=typeof window.pspPushGetState==='function'&&
            window.pspPushGetState()==='on';
          if(!serverSubscribed && 'Notification' in window && Notification.permission==='granted'){
            try{new Notification('🔥 HOT Market News: '+item.title.slice(0,75),
              {body:item.source,tag:'psp-hot-'+item.id});}catch(e){}
          }
        }
        function nhShowToast(item){const s=NH_CATS[item.cat]||NH_CATS.political;const tc=document.getElementById('nhToasts');if(!tc)return;if(!document.getElementById('nhClearBtn')){const cb=document.createElement('button');cb.id='nhClearBtn';cb.textContent='✕ Clear all';cb.style.cssText='pointer-events:all;cursor:pointer;align-self:flex-end;background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-primary);font-size:11px;font-weight:700;padding:5px 10px;border-radius:8px;font-family:inherit';cb.onclick=nhClearToasts;tc.appendChild(cb);}const t=document.createElement('div');t.className='nh-toast';t.style.cssText=`background:var(--bg-card);border:1px solid var(--border);border-left:3px solid ${s.c};border-radius:10px;padding:12px 14px;pointer-events:all;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4)`;t.innerHTML=`<div style="font-size:9px;font-weight:800;text-transform:uppercase;color:${s.c};margin-bottom:4px">${s.l}</div><div style="font-size:12px;font-weight:600;line-height:1.4;color:var(--text-primary)">${item.title.slice(0,90)}</div><div style="font-size:10px;color:var(--text-muted);margin-top:3px">${item.source}</div>`;t.onclick=()=>{t.remove();nhMaybeHideClear();};tc.appendChild(t);const all=Array.prototype.slice.call(tc.querySelectorAll('.nh-toast'));while(all.length>3){all.shift().remove();}setTimeout(()=>{t.remove();nhMaybeHideClear();},8000);}
        function nhClearToasts(){const tc=document.getElementById('nhToasts');if(tc)tc.innerHTML='';}
        function nhMaybeHideClear(){const tc=document.getElementById('nhToasts');if(tc&&!tc.querySelector('.nh-toast')){const cb=document.getElementById('nhClearBtn');if(cb)cb.remove();}}

        let nhLoaded=false;
        window.nhInitLoad=function(){if(!nhLoaded){nhLoaded=true;nhLoad();setInterval(function(){if(document.hidden)return;const page=document.getElementById('page-newshub');if(!page||page.classList.contains('active'))nhLoad();},2*60*1000);}};
        