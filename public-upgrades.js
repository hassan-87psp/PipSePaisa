(function(){
  'use strict';

  const SVG={
    growth:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/><path d="m4 7 5-4 5 5 6-5"/></svg>',
    learn:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 12v5c3 2 7 2 10 0v-5M21 9v6"/></svg>',
    shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    chart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16M6 16l4-5 3 3 5-8"/><path d="M16 6h2v2"/></svg>',
    tools:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14v6M14 17h6"/></svg>',
    people:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2-6 6-6s6 2 6 6M16 5c3 0 4.5 1.5 4.5 4S19 13 16 13"/></svg>'
  };

  function setupTheme(){
    const legacy=localStorage.getItem('psp_theme');
    const current=localStorage.getItem('psp-theme');
    const theme=current||legacy||'light';
    localStorage.setItem('psp-theme',theme);
    localStorage.setItem('psp_theme',theme);
    const sync=()=>{
      const dark=document.body.classList.contains('dark')||document.body.classList.contains('dark-theme');
      localStorage.setItem('psp-theme',dark?'dark':'light');
      localStorage.setItem('psp_theme',dark?'dark':'light');
    };
    document.querySelector('.theme-btn')?.addEventListener('click',()=>setTimeout(sync,0));
  }

  function setupNavigation(){
    const nav=document.querySelector('.nav');
    const menu=document.querySelector('.menu');
    if(!nav||!menu)return;
    const homeLink=[...menu.querySelectorAll('a')].find(a=>a.textContent.trim().toLowerCase()==='home');
    if(homeLink&&!menu.querySelector('a[href*="broker-comparison"]')){
      const brokerReviews=document.createElement('a');
      brokerReviews.href='landing.html#broker-comparison';
      brokerReviews.textContent='Broker Reviews';
      brokerReviews.className='broker-reviews-link';
      homeLink.insertAdjacentElement('afterend',brokerReviews);
    }
    let toggle=document.querySelector('.mobile-menu');
    if(!toggle){
      toggle=document.createElement('button');
      toggle.className='mobile-menu';
      toggle.type='button';
      toggle.setAttribute('aria-label','Open navigation menu');
      toggle.setAttribute('aria-expanded','false');
      toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
      const actions=nav.querySelector('.actions,.nav-actions');
      (actions||nav).appendChild(toggle);
    }
    toggle.addEventListener('click',()=>{
      const open=menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded',String(open));
    });
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('is-open');toggle.setAttribute('aria-expanded','false')}));
  }

  function brandifyVisibleText(){
    const pattern=/PipSePaisa/gi;
    const skipped='SCRIPT,STYLE,NOSCRIPT,TEXTAREA,OPTION,SVG,CODE,PRE';
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const parent=node.parentElement;
      if(!parent||parent.closest('.brand-wordmark')||parent.closest(skipped)||!pattern.test(node.nodeValue||''))return NodeFilter.FILTER_REJECT;
      pattern.lastIndex=0;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const text=node.nodeValue;
      const fragment=document.createDocumentFragment();
      let last=0;
      pattern.lastIndex=0;
      for(const match of text.matchAll(pattern)){
        if(match.index>last)fragment.append(text.slice(last,match.index));
        const word=match[0];
        const mark=document.createElement('span');
        mark.className='brand-wordmark';
        mark.setAttribute('aria-label','PipSePaisa');
        mark.innerHTML='<span class="brand-primary">'+word.slice(0,3)+'</span><span class="brand-accent">'+word.slice(3,5)+'</span><span class="brand-primary">'+word.slice(5)+'</span>';
        fragment.append(mark);
        last=match.index+word.length;
      }
      if(last<text.length)fragment.append(text.slice(last));
      node.replaceWith(fragment);
    });
  }

  function improveImages(){
    document.querySelectorAll('img').forEach((img,index)=>{
      if(!img.hasAttribute('alt')){
        const card=img.closest('article,a,section');
        const heading=card?.querySelector('h2,h3,strong')?.textContent?.trim();
        img.alt=heading?`${heading} visual`:`PipSePaisa website visual ${index+1}`;
      }
      if(!img.closest('.hero,.hero-box,.hero-overlay-banner'))img.loading='lazy';
      img.decoding='async';
    });
  }

  function replaceIcons(){
    const icons=[SVG.growth,SVG.learn,SVG.shield,SVG.chart,SVG.tools,SVG.people];
    document.querySelectorAll('.iconbox,.info-ico').forEach((el,i)=>{el.innerHTML=icons[i%icons.length]});
  }

  function upgradeTools(){
    const grid=document.querySelector('#tools .category-grid');
    if(grid&&grid.children.length===5){
      const card=document.createElement('article');
      card.className='resource-card reveal is-visible';
      card.innerHTML='<span class="num">06</span><div class="iconbox">'+SVG.chart+'</div><h3>Economic Calendar</h3><p>Review scheduled economic events and plan your analysis around periods of potential market volatility.</p><a href="index.html#calendar">View Calendar →</a>';
      grid.appendChild(card);
    }
    const chart=document.querySelector('.chart');
    if(chart){
      chart.innerHTML='<svg viewBox="0 0 420 190" preserveAspectRatio="none" aria-label="Illustrative market chart"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5a318" stop-opacity=".32"/><stop offset="1" stop-color="#f5a318" stop-opacity="0"/></linearGradient></defs><g stroke="#263b55" stroke-width="1" opacity=".75"><path d="M0 38H420M0 76H420M0 114H420M0 152H420"/><path d="M70 0V190M140 0V190M210 0V190M280 0V190M350 0V190"/></g><g stroke="#63d1a8" stroke-width="2"><path d="M40 128v30M37 140h6v12h-6zM83 112v32M80 118h6v18h-6zM126 96v35M123 104h6v18h-6zM169 106v31M166 112h6v18h-6zM212 73v46M209 82h6v25h-6zM255 61v38M252 68h6v19h-6zM298 45v42M295 52h6v23h-6zM341 29v43M338 38h6v21h-6z"/></g><path d="M0 155C45 150 67 123 105 130s62-34 104-29 58-41 96-31 66-37 115-45V190H0Z" fill="url(#area)"/><path d="M0 155C45 150 67 123 105 130s62-34 104-29 58-41 96-31 66-37 115-45" fill="none" stroke="#f5a318" stroke-width="4" stroke-linecap="round"/></svg>';
    }
  }

  function upgradeToolCardBanners(){
    if(!document.body.classList.contains('page-tools'))return;
    const cards=[...document.querySelectorAll('#tools .category-grid .resource-card')];
    const banners=[
      ['journal','Trading Journal'],
      ['calculators','Forex Calculators'],
      ['strength','Currency Strength'],
      ['alerts','Market Alerts'],
      ['news','Fundamental News'],
      ['calendar','Economic Calendar']
    ];
    const dark=document.body.classList.contains('dark')||document.body.classList.contains('dark-theme');
    cards.slice(0,banners.length).forEach((card,index)=>{
      if(card.querySelector('.tool-mini-banner'))return;
      const [key,title]=banners[index];
      const existingLink=card.querySelector('a');
      const banner=document.createElement('a');
      banner.className='tool-mini-banner';
      banner.href=existingLink?.getAttribute('href')||'index.html';
      banner.setAttribute('aria-label',title);
      var toolBannerVersion='20260722-clean-tool-icons-v2';
      banner.innerHTML='<img loading="lazy" decoding="async" alt="'+title+' premium tool banner" data-light="tool-card-banners/'+key+'-light.webp?v='+toolBannerVersion+'" data-dark="tool-card-banners/'+key+'-dark.webp?v='+toolBannerVersion+'" src="tool-card-banners/'+key+'-'+(dark?'dark':'light')+'.webp?v='+toolBannerVersion+'">';
      card.appendChild(banner);
    });
  }

  function fixLinks(){
    document.querySelectorAll('a').forEach(a=>{
      if(a.matches('.topbar .login'))a.href='index.html#auth-login';
      else if(a.matches('.facebook,#socialFacebook'))a.href='https://www.facebook.com/share/1AUgXGtVYy/';
      else if(a.matches('.instagram,#socialInstagram'))a.href='https://www.instagram.com/pipsepaisa/';
      else if(a.matches('.whatsapp,#socialWhatsapp'))a.href='https://wa.me/601156558689';
      else if(a.closest('.broker-grid,.broker-logo-grid,.partner-promo-grid'))a.href='partner.html#partner-programs';
      else if(a.closest('.partner-info'))a.href='index.html#auth-login';
      else if(a.closest('.course-card'))a.href='index.html#auth-login';
      else if(a.closest('.resource-card'))a.href='index.html';
      else if(a.getAttribute('href')==='#')a.href='landing.html';
    });
    document.querySelectorAll('.broker-card-footer span').forEach(el=>{el.textContent='View Program →'});
  }

  function upgradePartnerBanners(){
    const cards=[...document.querySelectorAll('.partner-detail')];
    const banners=[
      ['partner-banner-assets/dprime-light.webp','partner-banner-assets/dprime-dark.webp','DPrime partner program banner'],
      ['partner-banner-assets/xm-light.webp','partner-banner-assets/xm-dark.webp','XM partner program banner'],
      ['partner-banner-assets/exness-light.webp','partner-banner-assets/exness-dark.webp','Exness partner program banner']
    ];
    const dark=document.body.classList.contains('dark')||document.body.classList.contains('dark-theme');
    cards.slice(0,3).forEach((card,index)=>{
      const imageCard=card.querySelector('.partner-image');
      const img=imageCard?.querySelector('img');
      const banner=banners[index];
      if(!img||!banner)return;
      imageCard.classList.add('partner-program-theme-hover');
      imageCard.tabIndex=0;
      imageCard.setAttribute('role','img');
      imageCard.setAttribute('aria-label',banner[2]+' — hover to preview the opposite theme');
      img.dataset.light=banner[0];
      img.dataset.dark=banner[1];
      img.src=dark?banner[1]:banner[0];
      img.alt=banner[2];
      img.width=1200;
      img.height=1200;
      img.loading='lazy';
    });
  }

  function upgradeCourseProcessBanners(){
    const cards=[...document.querySelectorAll('.why-section .feature-card')];
    const banners=[
      ['course-process-banners/beginner-light.webp','course-process-banners/beginner-dark.webp','Beginner-Friendly Lessons'],
      ['course-process-banners/practical-light.webp','course-process-banners/practical-dark.webp','Practical Market Education'],
      ['course-process-banners/risk-light.webp','course-process-banners/risk-dark.webp','Risk-Focused Learning'],
      ['course-process-banners/guidance-light.webp','course-process-banners/guidance-dark.webp','Professional Guidance']
    ];
    const dark=document.body.classList.contains('dark')||document.body.classList.contains('dark-theme');
    cards.slice(0,4).forEach((card,index)=>{
      const banner=banners[index];
      if(!banner||card.querySelector('.course-process-banner'))return;
      const visual=document.createElement('div');
      visual.className='course-process-banner';
      visual.tabIndex=0;
      visual.setAttribute('role','img');
      visual.setAttribute('aria-label',banner[2]+' — hover to preview the opposite theme');
      const image=document.createElement('img');
      image.dataset.light=banner[0];
      image.dataset.dark=banner[1];
      image.src=dark?banner[1]:banner[0];
      image.alt=banner[2];
      image.width=600;
      image.height=320;
      image.loading='lazy';
      visual.appendChild(image);
      card.appendChild(visual);
    });
  }

  function setupBrokerThemePreview(){
    const cardSelectors=[
      '.broker-logo-card',
      '.broker-card',
      '.partner-program-theme-hover',
      '.service-banner-card',
      '.partner-promo-card.visual-promo-card',
      '.benefits-bg .feature-card',
      '.why-section .feature-card'
    ];
    const cards=[...document.querySelectorAll(cardSelectors.join(','))];

    const currentThemeIsDark=()=>
      document.body.classList.contains('dark')||document.body.classList.contains('dark-theme');

    const showTheme=(card,showOpposite)=>{
      const image=card.querySelector('img[data-light][data-dark]');
      if(!image)return;
      const useDark=showOpposite?!currentThemeIsDark():currentThemeIsDark();
      image.src=useDark?image.dataset.dark:image.dataset.light;
      card.classList.toggle('is-theme-preview',showOpposite);
    };

    cards.forEach(card=>{
      const image=card.querySelector('img[data-light][data-dark]');
      if(!image)return;
      [image.dataset.light,image.dataset.dark].forEach(src=>{const preload=new Image();preload.src=src});
      card.classList.add('broker-theme-preview');
      if(card.matches('.service-banner-card,.partner-promo-card.visual-promo-card,.benefits-bg .feature-card,.why-section .feature-card')){
        card.classList.add('home-content-theme-hover');
      }
      card.addEventListener('mouseenter',()=>showTheme(card,true));
      card.addEventListener('mouseleave',()=>showTheme(card,false));
      card.addEventListener('focusin',()=>showTheme(card,true));
      card.addEventListener('focusout',()=>showTheme(card,false));
    });

    document.querySelector('.theme-btn')?.addEventListener('click',()=>{
      setTimeout(()=>cards.forEach(card=>showTheme(card,card.matches(':hover'))),0);
    });
  }

  function footerMarkup(){
    const year=new Date().getFullYear();
    return '<div class="footer-main"><div class="container"><div class="footer-grid"><div><div class="footer-brand"><img src="favicon.png" alt="PipSePaisa logo">PipSePaisa</div><p class="footer-about">Practical Forex education, structured learning resources and professional business support built around knowledge, discipline and responsible decision-making.</p><div class="footer-socials"><a href="https://www.facebook.com/share/1AUgXGtVYy/" target="_blank" rel="noopener" aria-label="PipSePaisa on Facebook"><svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v2H6v4h3v9h4v-9h3.2l.8-4H13V9c0-.7.3-1 1-1z"/></svg></a><a href="https://www.instagram.com/pipsepaisa/" target="_blank" rel="noopener" aria-label="PipSePaisa on Instagram"><svg viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5z"/></svg></a><a href="https://wa.me/601156558689" target="_blank" rel="noopener" aria-label="Contact PipSePaisa on WhatsApp"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.4A10 10 0 1 0 12 2zm5.1 14.1c-.2.7-1.2 1.3-1.9 1.4-1.7.2-4.8-1.3-6.7-4-1.8-2.7-2.1-4.7-1.5-5.8.3-.6.8-1 1.4-1h.6c.2 0 .4 0 .6.5l.8 2c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4 0 .7.8 1.4 1.8 2.4 3.3 3.1.3.1.5.1.7-.1l.9-1.1c.2-.3.5-.3.8-.2l2 .9c.3.2.5.3.5.5 0 .3-.1 1.1-.3 1.6z"/></svg></a></div></div><div><h4>Quick Links</h4><ul><li><a href="landing.html">Home</a></li><li><a href="courses.html">Courses</a></li><li><a href="partner.html">Become a Partner</a></li><li><a href="tools-services.html">Tools & Services</a></li></ul></div><div><h4>Learning</h4><ul><li><a href="courses.html#courses">Course Library</a></li><li><a href="tools-services.html#tools">Trading Resources</a></li><li><a href="partner.html#partner-programs">Partner Programs</a></li><li><a href="index.html#auth-login">Member Login</a></li></ul></div><div><h4>Contact</h4><ul><li><a href="https://wa.me/601156558689" target="_blank" rel="noopener">WhatsApp Support</a></li><li><a href="https://www.instagram.com/pipsepaisa/" target="_blank" rel="noopener">Instagram</a></li><li><a href="https://www.facebook.com/share/1AUgXGtVYy/" target="_blank" rel="noopener">Facebook</a></li></ul></div></div><div class="risk-note"><strong>Risk notice:</strong> All content is provided for educational purposes only and does not constitute financial advice. Trading involves risk, and broker availability, conditions and promotions vary by jurisdiction and official terms.</div></div></div><div class="footer-bottom"><div class="container"><span>© '+year+' PipSePaisa. All rights reserved.</span><span>Education • Discipline • Responsible Growth</span></div></div>';
  }

  function upgradeFooter(){
    document.querySelectorAll('footer').forEach(footer=>{footer.className='psp-footer';footer.innerHTML=footerMarkup()});
  }

  function improveSEO(){
    const map={
      'landing.html':['PipSePaisa — Forex Education & Trading Tools','Learn Forex through structured courses, practical tools and responsible market education from PipSePaisa.'],
      'courses.html':['Forex Courses | PipSePaisa','Explore structured PipSePaisa Forex learning paths from beginner foundations to advanced market education.'],
      'partner.html':['Partner Education & Support | PipSePaisa','Explore PipSePaisa partner education, team training, marketing resources and broker-program information.'],
      'tools-services.html':['Trading Tools & Services | PipSePaisa','Use practical trading journals, calculators, market resources and educational services from PipSePaisa.']
    };
    const file=location.pathname.split('/').pop()||'landing.html';
    const info=map[file]||map['landing.html'];
    let desc=document.querySelector('meta[name="description"]');
    if(!desc){desc=document.createElement('meta');desc.name='description';document.head.appendChild(desc)}
    desc.content=info[1];
    const base='https://www.pipsepaisa.com/';
    const tags=[['link','canonical','href',base+file],['meta','og:title','content',info[0]],['meta','og:description','content',info[1]],['meta','og:type','content','website'],['meta','og:url','content',base+file],['meta','og:image','content',base+'hero-bg-light.png']];
    tags.forEach(([tag,key,attr,value])=>{let el=tag==='link'?document.querySelector('link[rel="'+key+'"]'):document.querySelector('meta[property="'+key+'"]');if(!el){el=document.createElement(tag);if(tag==='link')el.rel=key;else el.setAttribute('property',key);document.head.appendChild(el)}el.setAttribute(attr,value)});
  }

  function cleanupIds(){
    const ids=new Set();
    document.querySelectorAll('[id]').forEach(el=>{if(ids.has(el.id))el.removeAttribute('id');else ids.add(el.id)});
  }

  function upgradeToolsHero(){
    if(!document.body.classList.contains('page-tools'))return;
    const copy=document.querySelector('.hero .hero-copy');
    if(!copy)return;
    const mini=copy.querySelector('.mini');
    const title=copy.querySelector('h1');
    const description=copy.querySelector('p');
    const pills=copy.querySelector('.pills');
    const button=copy.querySelector('.login');
    if(mini)mini.textContent='PIPSEPAISA TRADING SUITE';
    if(title)title.innerHTML='Professional Tools for<br><span>Smarter Trading</span>';
    if(description)description.textContent='Use a structured trading journal, live calculators, currency-strength data and global market news in one focused workspace.';
    if(pills)pills.innerHTML='<span class="pill">Trading Journal</span><span class="pill">6 Live Calculators</span><span class="pill">Currency Strength</span><span class="pill">World News</span>';
    if(button)button.textContent='Explore the Platform ↓';

    const visual=document.querySelector('.hero .tools-visual');
    if(!visual)return;
    visual.innerHTML='<div class="tools-hero-badge"><i></i><span>JOURNAL-FIRST WORKSPACE</span></div><div class="tools-suite" aria-label="PipSePaisa platform preview"><div class="tools-suite-bar"><span class="tools-suite-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="tools-suite-brand"><b>PipSePaisa</b> Professional Suite</span><span class="tools-suite-status"><i></i> LIVE PLATFORM</span></div><div class="tools-suite-screen"><img class="tools-suite-image" src="tools-hero-assets/performance.webp" alt="PipSePaisa Trading Journal performance dashboard"><div class="tools-suite-caption"><span class="tools-suite-icon">01</span><span><b>Trading Journal</b><small>Track, review and improve your performance</small></span></div></div><div class="tools-suite-tabs" role="tablist" aria-label="Platform previews"><button class="tools-suite-tab is-active" type="button" role="tab" aria-selected="true" data-image="tools-hero-assets/performance.webp" data-alt="PipSePaisa Trading Journal performance dashboard" data-title="Trading Journal" data-note="Track, review and improve your performance"><span>01</span><b>Journal</b></button><button class="tools-suite-tab" type="button" role="tab" aria-selected="false" data-image="tools-hero-assets/tools-dashboard.webp" data-alt="PipSePaisa trading calculators dashboard" data-title="Trading Calculators" data-note="Plan risk with six practical calculators"><span>02</span><b>Calculators</b></button><button class="tools-suite-tab" type="button" role="tab" aria-selected="false" data-image="tools-hero-assets/currency-strength.webp" data-alt="PipSePaisa currency strength dashboard" data-title="Currency Strength" data-note="Compare major currencies in one clear view"><span>03</span><b>Strength</b></button><button class="tools-suite-tab" type="button" role="tab" aria-selected="false" data-image="tools-hero-assets/world-news.webp" data-alt="PipSePaisa world news dashboard" data-title="World News Hub" data-note="Follow important global market developments"><span>04</span><b>World News</b></button></div></div>';

    const image=visual.querySelector('.tools-suite-image');
    const captionTitle=visual.querySelector('.tools-suite-caption b');
    const captionNote=visual.querySelector('.tools-suite-caption small');
    const captionNumber=visual.querySelector('.tools-suite-icon');
    const tabs=[...visual.querySelectorAll('.tools-suite-tab')];
    tabs.forEach(tab=>{
      const preload=new Image();
      preload.src=tab.dataset.image;
      const activate=()=>{
        if(tab.classList.contains('is-active'))return;
        tabs.forEach(item=>{
          const active=item===tab;
          item.classList.toggle('is-active',active);
          item.setAttribute('aria-selected',active?'true':'false');
        });
        image.classList.add('is-changing');
        window.setTimeout(()=>{
          image.src=tab.dataset.image;
          image.alt=tab.dataset.alt;
          captionTitle.textContent=tab.dataset.title;
          captionNote.textContent=tab.dataset.note;
          captionNumber.textContent=tab.querySelector('span').textContent;
          image.classList.remove('is-changing');
        },120);
      };
      tab.addEventListener('mouseenter',activate);
      tab.addEventListener('focus',activate);
      tab.addEventListener('click',activate);
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    setupTheme();
    setupNavigation();
    improveImages();
    replaceIcons();
    upgradeTools();
    upgradeToolCardBanners();
    fixLinks();
    upgradePartnerBanners();
    upgradeCourseProcessBanners();
    setupBrokerThemePreview();
    upgradeFooter();
    improveSEO();
    upgradeToolsHero();
    brandifyVisibleText();
    cleanupIds();
  });
})();
