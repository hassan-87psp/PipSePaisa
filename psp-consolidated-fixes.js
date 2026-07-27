(function(){
  'use strict';
  const LINKS={
    dprime:'https://my.dooprime.com/links/go/72929',
    xmClient:'https://affs.click/BvyF2',xmPartner:'https://affs.click/vKyT2',
    exness:'https://one.exnessonelink.com/a/be2kjlypr9',
    vantage:'https://vigco.co/la-com-inv/opun7U0W',
    hfm:'https://www.grouphf.com/Pipsepaisa?refid=3'
  };
  function fixBrokerLinks(){
    document.querySelectorAll('a.broker-logo-card').forEach(a=>{
      const t=(a.textContent+' '+(a.querySelector('img')?.alt||'')).toLowerCase();
      if(t.includes('dprime')||t.includes('d prime'))a.href=LINKS.dprime;
      else if(t.includes('exness'))a.href=LINKS.exness;
      else if(t.includes('xm'))a.href=LINKS.xmClient;
      else if(t.includes('vantage'))a.href=LINKS.vantage;
      else if(t.includes('hfm'))a.href=LINKS.hfm;
      a.target='_blank';a.rel='noopener';
    });
    document.querySelectorAll('a,button').forEach(el=>{
      const t=(el.textContent||'').trim().toLowerCase();
      if(t.includes('view dprime program details')||t.includes('open dprime partner')){el.textContent='Open DPrime Partner Account →';if(el.tagName==='A')el.href=LINKS.dprime;}
      if(t.includes('view xm program details')||t.includes('open xm partner')){el.textContent='Open XM Partner Account →';if(el.tagName==='A')el.href=LINKS.xmPartner;}
      if(t.includes('view exness program details')||t.includes('open exness partner')){el.textContent='Open Exness Partner Account →';if(el.tagName==='A')el.href=LINKS.exness;}
    });
  }
  function removeDuplicateTickers(){
    const selectors=['#pipTickerTapeWrap','.pip-ticker-tape-wrap','.tradingview-widget-container'];
    const candidates=[];selectors.forEach(s=>document.querySelectorAll(s).forEach(n=>{if(!candidates.includes(n))candidates.push(n)}));
    const wrappers=candidates.filter(n=>n.id==='pipTickerTapeWrap'||n.classList?.contains('pip-ticker-tape-wrap'));
    wrappers.slice(1).forEach(n=>n.remove());
    const keep=wrappers[0];if(keep){const frames=keep.querySelectorAll('iframe');frames.forEach((f,i)=>{if(i>0)f.remove();});}
  }
  function removeUselessMenus(){document.querySelectorAll('.mobile-menu,.menu-toggle,.hamburger').forEach(n=>n.remove());}
  function improveImages(){document.querySelectorAll('img').forEach((img,i)=>{if(i>3&&!img.hasAttribute('loading'))img.loading='lazy';img.decoding='async';});}
  function init(){fixBrokerLinks();removeDuplicateTickers();removeUselessMenus();improveImages();}
  document.addEventListener('DOMContentLoaded',init);
  window.addEventListener('load',()=>{init();setTimeout(removeDuplicateTickers,700);});
  new MutationObserver(()=>removeDuplicateTickers()).observe(document.documentElement,{childList:true,subtree:true});
})();

/* ==========================================================
   IB JOIN MODAL RELIABILITY FIX
   Prevents concatenation source text from appearing in modal.
   ========================================================== */
(function installSafeIbJoinModal(){
  function esc(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function renderSafeIbJoin(id){
    try {
      var plans = window.vipPlansById || {};
      var p = plans[id];
      if (!p) {
        if (typeof window.showToast === 'function') window.showToast('Plan details are unavailable.');
        return;
      }

      var dur = p.period === 'lifetime' ? 36500 : (p.period === 'yearly' ? 365 : 30);
      window._ibJoin = { plan: p, dur: dur };

      var host = document.getElementById('vipModalHost');
      if (!host) return;

      var minDeposit = Number(p.ibdep || 0);
      var currency = esc(p.currency || 'USD');
      var accountStep = p.iblink
        ? '<b>Step 1:</b> <a href="' + esc(p.iblink) + '" target="_blank" rel="noopener" style="color:var(--gold);font-weight:800;">Open your trading account here</a> under your mentor.<br>'
        : '<b>Step 1:</b> Open a trading account under your mentor.<br>';
      var depositStep = '<b>Step 2:</b> Deposit' + (minDeposit > 0 ? ' at least <b>' + minDeposit + ' ' + currency + '</b>' : '') + '.<br>';
      var registerButton = p.iblink
        ? '<a href="' + esc(p.iblink) + '" target="_blank" rel="noopener" class="psp-ib-register-btn">🔗 Open Account / Register</a>'
        : '';

      host.innerHTML = '';
      var overlay = document.createElement('div');
      overlay.className = 'psp-ib-overlay';
      overlay.innerHTML =
        '<section class="psp-ib-modal" role="dialog" aria-modal="true" aria-labelledby="pspIbTitle">' +
          '<header class="psp-ib-header">' +
            '<div id="pspIbTitle" class="psp-ib-title">🤝 ' + esc(p.name || 'Partner Program') + ' — Join via IB</div>' +
            '<button type="button" class="psp-ib-close" aria-label="Close">×</button>' +
          '</header>' +
          '<div class="psp-ib-steps">' + accountStep + depositStep + '<b>Step 3:</b> Submit your account number and deposit proof below.</div>' +
          registerButton +
          '<label class="psp-ib-label" for="ibAcc">Trading account number *</label>' +
          '<input id="ibAcc" class="psp-ib-input" placeholder="e.g. 12345678" autocomplete="off">' +
          '<label class="psp-ib-label" for="ibDep">Deposit amount</label>' +
          '<input id="ibDep" class="psp-ib-input" type="number" min="0" step="0.01" placeholder="e.g. 100">' +
          '<label class="psp-ib-label" for="ibProof">Upload deposit proof (screenshot) *</label>' +
          '<input id="ibProof" class="psp-ib-input psp-ib-file" type="file" accept="image/*">' +
          '<label class="psp-ib-label" for="ibNotes">Notes (optional)</label>' +
          '<textarea id="ibNotes" class="psp-ib-input" rows="3" placeholder="Anything your mentor should know"></textarea>' +
          '<div id="ibSubMsg" class="psp-ib-message" aria-live="polite"></div>' +
          '<button type="button" class="psp-ib-submit">🤝 Submit IB Request</button>' +
        '</section>';

      host.appendChild(overlay);
      overlay.addEventListener('click', function(event){
        if (event.target === overlay) {
          if (typeof window.closeVipModal === 'function') window.closeVipModal();
          else host.innerHTML = '';
        }
      });
      overlay.querySelector('.psp-ib-close').addEventListener('click', function(){
        if (typeof window.closeVipModal === 'function') window.closeVipModal();
        else host.innerHTML = '';
      });
      overlay.querySelector('.psp-ib-submit').addEventListener('click', function(){
        if (typeof window.submitIbJoin === 'function') window.submitIbJoin();
      });
    } catch (error) {
      console.error('IB modal render failed:', error);
    }
  }

  function activate(){ window.openIbJoin = renderSafeIbJoin; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', activate, {once:true});
  else activate();
  window.addEventListener('load', activate, {once:true});
})();
