(function(){
  'use strict';
  function hideBoot(){const b=document.getElementById('pipBoot');if(b)b.remove();const p=document.getElementById('pwaInstallBanner');if(p&&!sessionStorage.getItem('psp_app_ready'))p.style.display='none';}
  function renderChart(){
    try{
      const canvas=document.getElementById('perfChart');
      if(!canvas||typeof Chart==='undefined')return;
      const parent=canvas.parentElement;if(parent){parent.style.minHeight='340px';parent.style.height='340px';parent.style.position='relative';}
      if(typeof perfChart==='undefined'||!perfChart){if(typeof buildPerfChart==='function')buildPerfChart();}
      if(typeof perfChart==='undefined'||!perfChart)return;
      const list=(typeof trades!=='undefined'&&Array.isArray(trades))?trades:[];
      let cumulative=0;const labels=['Start'];const values=[0];
      list.slice().sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach((t,i)=>{cumulative+=Number(t.pnl)||0;labels.push('T'+(i+1));values.push(cumulative);});
      perfChart.data.labels=labels;perfChart.data.datasets[0].data=values;
      const final=values[values.length-1]||0;const color=final>=0?'#10b981':'#ef4444';
      perfChart.data.datasets[0].borderColor=color;perfChart.data.datasets[0].backgroundColor=final>=0?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)';
      perfChart.data.datasets[0].pointRadius=values.length>1?3:0;
      const min=Math.min.apply(null,values),max=Math.max.apply(null,values),y=perfChart.options.scales.y;
      delete y.min;delete y.max;delete y.suggestedMin;delete y.suggestedMax;
      if(min>=0){y.min=0;y.suggestedMax=max===0?1:max*1.12;}
      else if(max<=0){y.max=0;y.suggestedMin=min*1.12;}
      perfChart.resize();perfChart.update('none');
    }catch(e){console.warn('Performance chart repair:',e);}
  }
  function patchNavigation(){
    if(window.__pspPerfNavPatched||typeof showPage!=='function')return;
    const original=showPage;window.showPage=function(page,el){const r=original.apply(this,arguments);if(page==='performance'||page==='dashboard')setTimeout(renderChart,80);return r;};window.__pspPerfNavPatched=true;
  }
  document.addEventListener('DOMContentLoaded',()=>{hideBoot();patchNavigation();setTimeout(renderChart,150);setTimeout(renderChart,900);setTimeout(()=>{sessionStorage.setItem('psp_app_ready','1');},10000);});
  window.addEventListener('load',()=>{hideBoot();setTimeout(renderChart,120);});
  window.addEventListener('resize',()=>setTimeout(renderChart,80),{passive:true});
  setInterval(()=>{patchNavigation();const p=document.getElementById('page-performance');if(p?.classList.contains('active'))renderChart();},1800);
})();
