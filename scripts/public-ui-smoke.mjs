// Read-only browser smoke checks for public PipSePaisa pages.
// Do NOT submit forms, trigger enrollment/payments or change website data.
import puppeteer from 'puppeteer-core';

const site='https://www.pipsepaisa.com';
const scenarios=[
  {name:'home-mobile',path:'/',w:390,h:844,selector:'.hero h1'},
  {name:'home-desktop',path:'/',w:1365,h:900,selector:'.hero h1'},
  {name:'courses-mobile',path:'/courses/',w:390,h:844,selector:'.course-card.vsa'},
  {name:'courses-desktop',path:'/courses/',w:1365,h:900,selector:'.course-card.vsa'},
  {name:'vsa-mobile',path:'/courses/vsa-volume-spread-analysis/',w:390,h:844,selector:'h1'},
  {name:'vsa-desktop',path:'/courses/vsa-volume-spread-analysis/',w:1365,h:900,selector:'h1'},
  {name:'learning-mobile',path:'/learn/volume-spread-analysis/',w:390,h:844,selector:'h1'}
];
const errors=[],warnings=[];
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
  for(const sc of scenarios){
    const page=await browser.newPage();
    await page.setViewport({width:sc.w,height:sc.h,deviceScaleFactor:1,isMobile:sc.w<600,hasTouch:sc.w<600});
    const jsErrors=[];
    page.on('pageerror',e=>jsErrors.push(String(e.message||e)));
    try {
      const response=await page.goto(site+sc.path,{waitUntil:'domcontentloaded',timeout:35000});
      if(!response||response.status()>=400){errors.push(sc.name+' HTTP '+response?.status());continue}
      await new Promise(r=>setTimeout(r,1300));
      const state=await page.evaluate(selector=>{
        const target=document.querySelector(selector),vsa=document.querySelector('.course-card.vsa');
        const box=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
        const isVisible=el=>{if(!el)return false;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'};
        const vsaButton=vsa?.querySelector('button[onclick*="pspPublicCourseCTA"]');
        const vsaLink=vsa?.querySelector('a.course-seo-link');
        const enrollment=document.querySelector('a[href="/courses/?psp_enroll=vsa"]');
        const heroCta=document.querySelector('.hero-primary-cta');
        const image=document.querySelector('.course-card.vsa img.course-cover, img.cover');
        return {
          url:location.pathname,
          h1:document.querySelector('h1')?.textContent?.trim().slice(0,100)||'',
          target:isVisible(target),targetRect:box(target),
          viewport:document.documentElement.clientWidth,
          pageWidth:document.documentElement.scrollWidth,
          cardVisible:isVisible(vsa),
          courseButton:!!vsaButton&&isVisible(vsaButton),
          courseButtonFn:typeof window.pspPublicCourseCTA==='function',
          detailsLink:vsaLink?.getAttribute('href')||null,
          enrollmentHref:enrollment?.getAttribute('href')||null,
          heroCta:heroCta?.getAttribute('href')||null,
          vsaImage:{present:!!image,loaded:!!image?.naturalWidth,complete:!!image?.complete}
        };
      },sc.selector);
      if(!state.target)errors.push(sc.name+' main section missing/hidden');
      if(!state.h1)errors.push(sc.name+' H1 missing');
      if(state.pageWidth>state.viewport+20)warnings.push(sc.name+' horizontal overflow '+(state.pageWidth-state.viewport)+'px');
      if(sc.path==='/'){
        if(state.heroCta!=='/courses/#courses')errors.push(sc.name+' hero CTA destination changed');
      }
      if(sc.path==='/courses/'){
        if(!state.courseButton)errors.push(sc.name+' VSA enrollment button hidden');
        if(state.detailsLink!=='/courses/vsa-volume-spread-analysis/')errors.push(sc.name+' VSA details link changed');
        if(!state.courseButtonFn)warnings.push(sc.name+' VSA enrollment click handler not detected at 1.3s');
      }
      if(sc.path==='/courses/vsa-volume-spread-analysis/'){
        if(state.enrollmentHref!=='/courses/?psp_enroll=vsa')errors.push(sc.name+' course enrollment link changed');
        if(!state.vsaImage.loaded)warnings.push(sc.name+' VSA cover did not report loaded');
      }
      if(jsErrors.length)warnings.push(sc.name+' browser JS errors: '+jsErrors.slice(0,3).join(' | ').slice(0,500));
      console.log('UI_CHECK '+JSON.stringify({name:sc.name,...state,jsErrorCount:jsErrors.length}));
    } catch(e){errors.push(sc.name+' '+String(e.message||e).slice(0,250))}
    finally {await page.close()}
  }
} finally {await browser.close()}
warnings.forEach(x=>console.log('UI_WARN '+x));
errors.forEach(x=>console.error('UI_FAIL '+x));
console.log('UI_SUMMARY scenarios='+scenarios.length+' errors='+errors.length+' warnings='+warnings.length);
if(errors.length)process.exitCode=1;
