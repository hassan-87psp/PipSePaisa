/* PipSePaisa smooth wheel scrolling v323 - capture mode */
(function(){
  'use strict';
  try{
    if(window.__PSP_SMOOTH_WHEEL_V323__)return;
    window.__PSP_SMOOTH_WHEEL_V323__=true;

    var root=document.documentElement;
    var target=window.scrollY||window.pageYOffset||0;
    var raf=0,running=false,lastWheel=0;

    var style=document.createElement('style');
    style.textContent='html.psp-wheel-v323{scroll-behavior:auto!important}';
    (document.head||root).appendChild(style);

    function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
    function maxY(){
      var b=document.body;
      return Math.max(0,Math.max(root.scrollHeight,b?b.scrollHeight:0)-window.innerHeight);
    }
    function nestedCanScroll(el,dy){
      while(el&&el!==document.body&&el!==root){
        var s=getComputedStyle(el),oy=s.overflowY;
        if((oy==='auto'||oy==='scroll')&&el.scrollHeight>el.clientHeight+2){
          var top=el.scrollTop,bottom=top+el.clientHeight;
          if((dy<0&&top>1)||(dy>0&&bottom<el.scrollHeight-1))return true;
        }
        el=el.parentElement;
      }
      return false;
    }
    function tick(){
      var y=window.scrollY||window.pageYOffset||0;
      var diff=target-y;
      if(Math.abs(diff)<0.35){
        window.scrollTo(0,target);
        running=false;raf=0;root.classList.remove('psp-wheel-v323');
        return;
      }
      /* Softer premium glide */
      window.scrollTo(0,y+diff*0.058);
      raf=requestAnimationFrame(tick);
    }
    function sync(){
      if(raf)cancelAnimationFrame(raf);
      raf=0;running=false;root.classList.remove('psp-wheel-v323');
      target=window.scrollY||window.pageYOffset||0;
    }
    function onWheel(e){
      if(e.defaultPrevented||e.ctrlKey||e.metaKey||Math.abs(e.deltaY)<0.01)return;
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
      if(e.target&&e.target.closest&&e.target.closest('select,textarea,input,[contenteditable="true"]'))return;
      if(nestedCanScroll(e.target,e.deltaY))return;

      var d=e.deltaY;
      if(e.deltaMode===1)d*=16;
      else if(e.deltaMode===2)d*=window.innerHeight;

      d=clamp(d,-230,230);
      var now=performance.now?performance.now():Date.now();
      if(!running||now-lastWheel>220)target=window.scrollY||window.pageYOffset||0;
      lastWheel=now;
      target=clamp(target+d,0,maxY());

      e.preventDefault();
      e.stopPropagation();
      root.classList.add('psp-wheel-v323');
      if(!running){running=true;raf=requestAnimationFrame(tick)}
    }

    /* Capture phase makes this win over page-specific wheel handlers. */
    document.addEventListener('wheel',onWheel,{passive:false,capture:true});
    window.addEventListener('resize',function(){target=clamp(target,0,maxY())},{passive:true});
    window.addEventListener('mousedown',sync,{passive:true});
    window.addEventListener('touchstart',function(){if(running)sync()},{passive:true});
    window.addEventListener('keydown',function(e){
      if(['PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].indexOf(e.key)!==-1)sync();
    },{passive:true});
  }catch(_e){}
})();