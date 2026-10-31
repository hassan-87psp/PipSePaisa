// PipSePaisa comprehensive read-only public website audit.
// No user sessions, clicks, form submissions, payment calls, or database writes.
import puppeteer from 'puppeteer-core';

const ORIGIN = 'https://www.pipsepaisa.com';
const extraPaths = [
  '/admin/','/admin-panel.html','/psp-mentor.html','/team/','/sign-in/','/sign-up/','/verify-account/',
  '/dashboard/','/profile/','/my-courses/','/vip-plans/','/free-access/',
  '/signals/','/live-charts/','/journal/','/support/',
  '/freecourse2/','/ad/technical/','/ad/fundamental/',
  '/eaindicator/','/economic-news/','/world-news/','/performance/','/my-trades/','/sajid-live/'
];
const warnings=[], failures=[], cases=[];
const now=Date.now();
const fail=(name,s)=>{failures.push(name+': '+s);console.error('FULL_AUDIT_FAIL '+name+' '+s)};
const warn=(name,s)=>{warnings.push(name+': '+s);console.log('FULL_AUDIT_WARN '+name+' '+s)};
const get=async url=>{const r=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(28000),headers:{'user-agent':'PipSePaisa-ReadOnlyBrowserAudit/1.0'}});return {url:r.url,status:r.status,body:await r.text()}};
let sitemap=[];
try{
  const s=await get(ORIGIN+'/sitemap.xml');
  sitemap=[...s.body.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
  if(!sitemap.length)fail('sitemap','no URLs found');
  else console.log('FULL_AUDIT_SITEMAP '+sitemap.length);
}catch(e){fail('sitemap',String(e.message||e))}

const safePaths = p=>{
  if(!p||typeof p!=='string')return false;
  return !/\.(?:zip|pdf|png|jpg|jpeg|webp|svg|gif|mp4|mp3|css|js|woff2?|map|ico)(?:$|\?)/i.test(p)
    && !/\/(?:logout|signout|delete|remove|unsubscribe|api|rest|functions)\b/i.test(p);
};
const linkPaths = new Set();
const browser=await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless:true, args:['--no-sandbox','--disable-dev-shm-usage']
});
async function pageCheck(target,mode,fromSitemap){
  const path=new URL(target,ORIGIN).pathname;
  const name=mode+' '+path;
  const page=await browser.newPage();
  const width=mode==='mobile'?390:1365;
  await page.setViewport({width,height:mode==='mobile'?844:850,isMobile:mode==='mobile',hasTouch:mode==='mobile',deviceScaleFactor:1});
  const jsErrors=[],assetErrors=[];
  page.on('pageerror',e=>jsErrors.push(String(e.message||e).slice(0,160)));
  page.on('response',r=>{
    const url=r.url();
    if(r.status()>=400 && (r.request().resourceType()==='script'||r.request().resourceType()==='stylesheet'||r.request().resourceType()==='image')) {
      if(url.startsWith(ORIGIN))assetErrors.push({code:r.status(),path:new URL(url).pathname});
    }
  });
  try{
    const response=await page.goto(target,{waitUntil:'domcontentloaded',timeout:35000});
    if(!response||response.status()>=400){fail(name,'HTTP '+(response?.status()||'no response'));return}
    await new Promise(r=>setTimeout(r,850));
    const state=await page.evaluate(()=>{
      const first=document.querySelector('h1');
      const signin=document.querySelector('input[type="password"]');
      const vsa=document.querySelector('.course-card.vsa');
      const links=[...document.querySelectorAll('a[href]')].slice(0,500).map(a=>a.getAttribute('href'));
      const visible=e=>{if(!e)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'};
      const covers=[...document.images].filter(img=>{let r=img.getBoundingClientRect();return r.top>=0&&r.top<innerHeight*1.5&&r.width>50&&r.height>50;}).slice(0,25);
      const badImages=covers.filter(i=>i.complete&&!i.naturalWidth).map(i=>(i.getAttribute('src')||'').slice(0,140));
      const lastLogin=document.querySelector('[name="email"],[type="email"],#loginEmail');
      return {
        title:document.title?.slice(0,85)||'',
        canonical:document.querySelector('link[rel="canonical"]')?.href||'',
        h1: first?.textContent?.trim().slice(0,100)||'',
        viewport:document.documentElement.clientWidth,
        scrollWidth:document.documentElement.scrollWidth,
        ready:document.readyState,
        links, badImages, hasPassword:!!signin, hasEmail:!!lastLogin,
        vsa:!!vsa, vsaButton:visible(vsa?.querySelector('button[onclick*="pspPublicCourseCTA"]')),
        vsaHandler:typeof window.pspPublicCourseCTA==='function',
        sections:document.querySelectorAll('main section').length,
        domReadyMs:Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd||0),
        loadedAssets:performance.getEntriesByType('resource').length,
        firstContentfulPaintMs:Math.round(performance.getEntriesByType('paint').find(p=>p.name==='first-contentful-paint')?.startTime||0)
      };
    });
    for(const href of state.links){
      if(!href||href.startsWith('#')||href.startsWith('javascript:')||href.startsWith('mailto:')||href.startsWith('tel:'))continue;
      let u;try{u=new URL(href,target)}catch{continue}
      if(u.origin===ORIGIN&&safePaths(u.pathname))linkPaths.add(u.pathname);
    }
    if(mode==='mobile'&&state.scrollWidth>state.viewport+16){
      const offending=await page.evaluate(()=>{
        const width=document.documentElement.clientWidth;
        return [...document.querySelectorAll('body *')].map(el=>{
          const box=el.getBoundingClientRect();
          return {el,box};
        }).filter(({box})=>box.width>2&&(box.right>width+3||box.left< -3))
          .slice(0,12).map(({el,box})=>({
            tag:el.tagName.toLowerCase(),id:el.id||'',className:typeof el.className==='string'?el.className.slice(0,110):'',
            left:Math.round(box.left),right:Math.round(box.right),width:Math.round(box.width)
          }));
      });
      console.log('FULL_AUDIT_OVERFLOW '+name+' '+JSON.stringify(offending));
      warn(name,'horizontal overflow '+(state.scrollWidth-state.viewport)+'px');
    }
    if(fromSitemap){
      if(!state.h1)fail(name,'missing H1');
      if(state.canonical!==target)fail(name,'wrong canonical '+state.canonical);
    }
    if(path==='/admin/'||path==='/admin-panel.html'){
      const boot=await page.evaluate(()=>{
        const app=document.querySelector('body > .app'),overlay=document.getElementById('loginOverlay');
        return {
          appHidden:!!app&&getComputedStyle(app).visibility==='hidden',
          overlayVisible:!!overlay&&getComputedStyle(overlay).display!=='none',
          ready:document.documentElement.classList.contains('psp-admin-view-ready'),
          guardedCSS:!!document.getElementById('pspAdminAtomicStartupV528')
        };
      });
      if(!boot.guardedCSS||!boot.appHidden||!boot.overlayVisible||boot.ready){
        fail(name,'admin auth startup revealed a partial workspace: '+JSON.stringify(boot));
      }else console.log('FULL_AUDIT_ADMIN_BOOT '+name+' '+JSON.stringify(boot));
    }
    if(['/dashboard/','/eaindicator/','/economic-news/','/world-news/'].includes(path)){
      const calendar=await page.evaluate(()=>{
        const page=document.getElementById('page-news');
        const btn=document.getElementById('pspEconomicAlertsBtn');
        const filter=page?.querySelector('.news-filter-group button[onclick*="setNewsTime(\\'week\\'"]');
        const actualFilter=page?.querySelector('.news-filter-group button.active[onclick*="setNewsTime(\\'week\\'"]');
        return {page:!!page,reminder:!!btn,weekButton:!!filter,weekActive:!!actualFilter,
          reminderRuntime:typeof window.pspCalendarAlertsToggle==='function',
          newsRuntime:typeof window.setNewsTime==='function'};
      });
      if(!calendar.page||!calendar.reminder||!calendar.weekActive||!calendar.reminderRuntime||!calendar.newsRuntime)
        fail(name,'economic calendar route not fully initialized: '+JSON.stringify(calendar));
      else console.log('FULL_AUDIT_ECONOMIC_CALENDAR '+name+' '+JSON.stringify(calendar));
    }
    if(path==='/courses/'){
      if(!state.vsa||!state.vsaButton||!state.vsaHandler)fail(name,'VSA enrollment CTA or handler missing');
    }
    if(path==='/sign-in/'&&(!state.hasPassword||!state.hasEmail))warn(name,'login inputs not found at page load');
    if(state.badImages.length){
      const detail='visible broken images: '+state.badImages.join(', ').slice(0,300);
      if(path.startsWith('/articles/read/'))fail(name,detail);
      else warn(name,detail);
    }
    if(state.domReadyMs>4500)warn(name,'slow DOM ready: '+state.domReadyMs+'ms');
    if(state.firstContentfulPaintMs>3000)warn(name,'slow first contentful paint: '+state.firstContentfulPaintMs+'ms');
    if(jsErrors.length)warn(name,'JS errors: '+[...new Set(jsErrors)].slice(0,2).join(' | '));
    if(assetErrors.length)warn(name,'failed local assets: '+JSON.stringify([...new Map(assetErrors.map(x=>[x.path,x])).values()].slice(0,5)));
    console.log('FULL_AUDIT_PAGE '+JSON.stringify({mode,path,status:response.status(),resolved:new URL(page.url()).pathname,
      title:state.title.slice(0,48),h1:!!state.h1,overflow:state.scrollWidth-state.viewport,jsErrorCount:jsErrors.length,
      brokenViewportImages:state.badImages.length,localAssetFailures:assetErrors.length,sections:state.sections,domReadyMs:state.domReadyMs,fcpMs:state.firstContentfulPaintMs,resources:state.loadedAssets}));
    cases.push({mode,path});
  }catch(e){fail(name,String(e.message||e).slice(0,220))}
  finally{await page.close()}
}
try{
  const tasks=[
    ...sitemap.map(u=>({url:u,mode:'mobile',sitemap:true})),
    ...sitemap.filter(u=>u===ORIGIN+'/'||/\/courses\/|\/tradingtools\/|\/mentors\/sajid-khan-ghori\/|\/broker-reviews\/|\/becomepartner\/|\/contact\//.test(u))
      .map(u=>({url:u,mode:'desktop',sitemap:true})),
    ...extraPaths.map(p=>({url:ORIGIN+p,mode:'mobile',sitemap:false}))
  ];
  let next=0;
  await Promise.all(Array.from({length:3},async()=>{while(next<tasks.length){const t=tasks[next++];await pageCheck(t.url,t.mode,t.sitemap)}}));

  const expected = new Set(sitemap.map(u=>new URL(u).pathname));
  const discover = [...linkPaths].filter(p=>!expected.has(p)).slice(0,100);
  console.log('FULL_AUDIT_DISCOVERED_EXTRA_LINK_PATHS '+discover.length);
  let checked=0,dead=[],redirect=[];
  let i=0;
  await Promise.all(Array.from({length:6},async()=>{
    while(i<discover.length){
      const path=discover[i++];
      try{
        const r=await fetch(ORIGIN+path,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(15000)});
        checked++;
        if(r.status>=400)dead.push({path,status:r.status});
        else if(new URL(r.url).pathname!==path)redirect.push({path,to:new URL(r.url).pathname});
      }catch(e){warn('link '+path,String(e.message||e).slice(0,140))}
    }
  }));
  if(dead.length)for(const d of dead.slice(0,25))warn('link',d.path+' returned '+d.status);
  console.log('FULL_AUDIT_LINKS '+JSON.stringify({sameOriginPathCount:linkPaths.size,extraChecked:checked,dead:dead.length,redirects:redirect.slice(0,18)}));
  console.log('FULL_AUDIT_SUMMARY '+JSON.stringify({auditedPages:cases.length,sitemapPages:sitemap.length,errors:failures.length,warnings:warnings.length,elapsedSeconds:Math.round((Date.now()-now)/1000)}));
}finally{await browser.close()}
if(failures.length)process.exitCode=1;
