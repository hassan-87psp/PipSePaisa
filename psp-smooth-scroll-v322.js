/* PipSePaisa global smooth wheel scrolling v322 */
(function(){
  'use strict';
  try{
    if (window.__PSP_SMOOTH_WHEEL_V322__) return;
    window.__PSP_SMOOTH_WHEEL_V322__ = true;

    var doc = document.documentElement;
    var targetY = window.scrollY || window.pageYOffset || 0;
    var rafId = 0;
    var running = false;
    var lastWheelAt = 0;

    var style = document.createElement('style');
    style.id = 'pspSmoothWheelStyleV322';
    style.textContent = 'html.psp-wheel-active{scroll-behavior:auto!important}';
    (document.head || doc).appendChild(style);

    function clamp(v,min,max){ return Math.min(max,Math.max(min,v)); }

    function maxScroll(){
      var b = document.body;
      return Math.max(0,Math.max(doc?doc.scrollHeight:0,b?b.scrollHeight:0)-window.innerHeight);
    }

    function nestedCanScroll(start,dy){
      var el=start&&start.nodeType===1?start:null;
      while(el&&el!==document.body&&el!==doc){
        var cs=window.getComputedStyle(el),oy=cs.overflowY;
        if((oy==='auto'||oy==='scroll')&&el.scrollHeight>el.clientHeight+2){
          var top=el.scrollTop,bottom=top+el.clientHeight;
          if((dy<0&&top>1)||(dy>0&&bottom<el.scrollHeight-1)) return true;
        }
        el=el.parentElement;
      }
      return false;
    }

    function finish(){
      window.scrollTo(0,targetY);
      running=false; rafId=0; doc.classList.remove('psp-wheel-active');
    }

    function animate(){
      var y=window.scrollY||window.pageYOffset||0;
      var diff=targetY-y;
      if(Math.abs(diff)<0.45){ finish(); return; }
      window.scrollTo(0,y+diff*0.072);
      rafId=window.requestAnimationFrame(animate);
    }

    function sync(){
      if(rafId) window.cancelAnimationFrame(rafId);
      rafId=0; running=false;
      doc.classList.remove('psp-wheel-active');
      targetY=window.scrollY||window.pageYOffset||0;
    }

    window.addEventListener('wheel',function(e){
      if(e.defaultPrevented||e.ctrlKey||e.metaKey||Math.abs(e.deltaY)<0.01) return;
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY)) return;
      if(e.target&&e.target.closest&&e.target.closest('select,textarea,input,[contenteditable="true"]')) return;
      if(nestedCanScroll(e.target,e.deltaY)) return;

      var delta=e.deltaY;
      if(e.deltaMode===1) delta*=16;
      else if(e.deltaMode===2) delta*=window.innerHeight;
      delta=clamp(delta,-280,280);

      var now=performance.now?performance.now():Date.now();
      if(!running||now-lastWheelAt>180) targetY=window.scrollY||window.pageYOffset||0;
      lastWheelAt=now;
      targetY=clamp(targetY+delta,0,maxScroll());

      e.preventDefault();
      doc.classList.add('psp-wheel-active');
      if(!running){ running=true; rafId=window.requestAnimationFrame(animate); }
    },{passive:false});

    window.addEventListener('scroll',function(){
      if(!running) targetY=window.scrollY||window.pageYOffset||0;
    },{passive:true});
    window.addEventListener('resize',function(){ targetY=clamp(targetY,0,maxScroll()); },{passive:true});
    window.addEventListener('mousedown',sync,{passive:true});
    window.addEventListener('keydown',function(e){
      if(['PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].indexOf(e.key)!==-1) sync();
    },{passive:true});
    window.addEventListener('touchstart',function(){ if(running) sync(); },{passive:true});
  }catch(_e){}
})();