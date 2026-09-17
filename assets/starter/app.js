'use strict';
// Original, deterministic specimen. No API, telemetry, or live training connection.
const $ = (s) => document.querySelector(s);
const runs = [{id:'pro',name:'atlas-pro',color:'var(--series-a)'},{id:'flash',name:'atlas-flash',color:'var(--series-b)'}];
const definitions = [
  ['quality/pass_rate','Mean fraction of successful attempts. Higher is better.',0.55,0.004,0.011,'ratio'],
  ['quality/reward_mean','Mean reward across evaluated samples.',0.43,0.006,0.016,'ratio'],
  ['policy/entropy','Entropy of the policy distribution.',0.58,-0.007,0.015,'nats'],
  ['policy/gradient_norm','Gradient norm before clipping.',0.008,-0.00014,0.0013,'norm'],
  ['throughput/tokens','Processed tokens per iteration.',1.7e9,3.2e7,1.6e8,'tokens'],
  ['timing/iteration','Elapsed wall time per iteration. Lower is better.',380,-4,38,'seconds']
];
const metrics = definitions.map(([key,description,base,slope,noise,unit],m)=>({key,description,unit,series:runs.map((r,j)=>({ ...r,points:Array.from({length:j?19:16},(_,i)=>({step:i+1,time:i*17+(i>7?31:0)+(i%3)*2+(j?4:0),value:base+slope*i+Math.sin(i*1.8+m+j)*noise+(j?(m===2?0.06:-base*0.075):0)})) }))}));
const state = {axis:'step',scale:'linear',smooth:0,category:'',query:'',view:'overview'};
let returnRoute = '#overview';
let activeMetric = null;
let lastTrigger = null;
const fmt = (v) => !Number.isFinite(v)?'—':Math.abs(v)>=1e9?(v/1e9).toFixed(2)+'B':Math.abs(v)>=1e6?(v/1e6).toFixed(2)+'M':Math.abs(v)>=1e3?(v/1e3).toFixed(1)+'k':Math.abs(v)<0.01?v.toPrecision(3):Number(v.toFixed(3)).toString();
const escapeText = (v) => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const delta = p => {const d=p.at(-1).value-p.at(-2).value;return (d>=0?'▲ ':'▼ ')+fmt(Math.abs(d));};
function renderRuns(){
  $('#runs').innerHTML = runs.map((r,i)=>`<article class="panel run"><div class="run-top"><div class="run-identity"><strong class="mono"><i class="dot ${i?'b':'a'}"></i>${r.name}</strong><span class="muted">demo snapshot</span></div><div class="run-step">step ${i?19:16}</div><div class="run-clock mono">${i?'05:47:00':'04:46:00'}<small>fictional elapsed time</small></div><div class="phase"><div class="track"><span style="width:${i?43:72}%"></span></div><span>example phase: ${i?'rollout':'training'}</span></div></div><div class="stats">${[
    ['quality/pass_rate',fmt(metrics[0].series[i].points.at(-1).value)],['example cost',i?'$24,180':'$68,240'],['tokens · step',fmt(metrics[4].series[i].points.at(-1).value)],['tokens · total',i?'34.2B':'29.1B'],['samples processed',i?'296k':'251k'],['batch size × attempts','1,024 × 16']
  ].map(([label,value])=>`<div class="stat"><div class="stat-label">${label}</div><div class="value">${value}</div></div>`).join('')}</div></article>`).join('');
}
function displayed(points){let previous;return points.map(p=>{const value=previous===undefined||state.smooth===0?p.value:(1-state.smooth/100)*p.value+(state.smooth/100)*previous;previous=value;return {...p,value,raw:p.value};});}
function drawChart(host,metric,large=false){
  host.replaceChildren();
  const plot=document.createElement('div');plot.className='plot';host.append(plot);
  const series=metric.series.map(s=>({...s,points:displayed(s.points)}));
  const values=series.flatMap(s=>s.points.map(p=>p.value));
  if(state.scale==='log'&&values.some(v=>v<=0)){plot.innerHTML='<div class="plot-message">Log scale requires positive values.<br>Choose linear to inspect this metric.</div>';return;}
  const width=Math.max(240,Math.round(host.getBoundingClientRect().width)||380),height=large?350:170,left=47,right=30,top=16,bottom=28;
  const tx=v=>state.scale==='log'?Math.log10(v):v;
  let lo=Math.min(...values.map(tx)),hi=Math.max(...values.map(tx));
  const pad=(hi-lo||Math.abs(hi)*0.1||1)*0.16;lo-=pad;hi+=pad;
  const xs=series.flatMap(s=>s.points.map(p=>p[state.axis]));const xmin=Math.min(...xs),xmax=Math.max(...xs);
  const X=v=>left+(v-xmin)/(xmax-xmin||1)*(width-left-right);
  const Y=v=>top+(hi-tx(v))/(hi-lo)*(height-top-bottom);
  let svg=`<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${escapeText(metric.key)}; ${state.axis} horizontal axis; ${state.scale} scale; ${state.smooth?'EMA smoothed':'raw'} values. Open the title for a data table.">`;
  for(let i=0;i<4;i++){const y=top+i*(height-top-bottom)/3,v=hi-i*(hi-lo)/3;svg+=`<line class="grid" x1="${left}" x2="${width-right}" y1="${y}" y2="${y}"/><text x="${left-7}" y="${y+3}" text-anchor="end">${fmt(state.scale==='log'?10**v:v)}</text>`;}
  for(let i=0;i<4;i++){const v=xmin+i*(xmax-xmin)/3;svg+=`<text x="${X(v)}" y="${height-8}" text-anchor="middle">${Math.round(v)}${state.axis==='time'?'m':''}</text>`;}
  for(const s of series){const last=s.points.at(-1);svg+=`<polyline class="line" stroke="${s.color}" points="${s.points.map(p=>`${X(p[state.axis])},${Y(p.value)}`).join(' ')}"/><circle cx="${X(last[state.axis])}" cy="${Y(last.value)}" r="3" fill="${s.color}"/>`;}
  svg+=`<line class="crosshair" y1="${top}" y2="${height-bottom}" visibility="hidden"/></svg><div class="chart-tip" hidden></div>`;
  plot.innerHTML=svg;
  const chart=plot.querySelector('svg'),tip=plot.querySelector('.chart-tip'),cross=plot.querySelector('.crosshair');
  chart.addEventListener('pointermove',event=>{
    const bounds=chart.getBoundingClientRect(),px=Math.max(left,Math.min(width-right,(event.clientX-bounds.left)/bounds.width*width));
    const target=xmin+(px-left)/(width-left-right)*(xmax-xmin);
    const nearest=series.map(s=>({...s,p:s.points.reduce((best,p)=>Math.abs(p[state.axis]-target)<Math.abs(best[state.axis]-target)?p:best)}));
    cross.setAttribute('x1',px);cross.setAttribute('x2',px);cross.setAttribute('visibility','visible');
    tip.hidden=false;tip.innerHTML=nearest.map((s,i)=>`<div><i class="dot ${i?'b':'a'}"></i>${s.name}<br>${state.axis} ${fmt(s.p[state.axis])}${state.axis==='time'?' min':''} · ${fmt(s.p.value)}${state.smooth?`<br>raw ${fmt(s.p.raw)}`:''}</div>`).join('');
    tip.style.left=Math.max(0,Math.min(bounds.width-tip.offsetWidth,event.clientX-bounds.left+12))+'px';tip.style.top='12px';
  });
  chart.addEventListener('pointerleave',()=>{tip.hidden=true;cross.setAttribute('visibility','hidden');});
  const note=document.createElement('div');note.className='chart-note';note.textContent=`${metric.unit} · ${state.axis==='time'?'elapsed minutes':'step'} · ${state.smooth?'EMA '+state.smooth+'% / summary: raw':'raw'}`;host.append(note);
}
function renderCharts(){
  let selected=metrics.filter(m=>!state.category||m.key.startsWith(state.category+'/'));
  let error='';
  try{const q=state.query.trim();if(q){const regex=q.startsWith('/')&&q.endsWith('/')&&q.length>1?new RegExp(q.slice(1,-1),'i'):null;selected=selected.filter(m=>regex?regex.test(m.key):m.key.toLowerCase().includes(q.toLowerCase()));}}
  catch{error='Invalid regular expression. Correct the expression or clear the filter.';selected=[];}
  $('#filter-status').textContent=error||`${selected.length} metrics · ${state.category||'all categories'}${state.query?' · filter: '+state.query:''} · fixed demo data`;
  $('#query').setAttribute('aria-invalid',String(Boolean(error)));
  $('#charts').replaceChildren();
  if(!selected.length){const empty=document.createElement('div');empty.className='empty';empty.textContent=error||'No matching metrics. Clear the filter or choose another category.';$('#charts').append(empty);return;}
  for(const metric of selected){
    const card=document.createElement('article');card.className='panel chart-card';
    card.innerHTML=`<div class="chart-head"><button class="chart-title" data-key="${metric.key}">${metric.key.replace('/','/<wbr>')}</button><div class="chart-values">${metric.series.map((s,i)=>`<div><i class="dot ${i?'b':'a'}"></i>${fmt(s.points.at(-1).value)} <span class="delta" title="Change from previous raw point">${delta(s.points)}</span></div>`).join('')}</div></div><div class="chart-body"></div>`;
    const trigger=card.querySelector('button');trigger.addEventListener('click',()=>{lastTrigger=trigger;returnRoute=location.hash||'#overview';location.hash='chart/'+encodeURIComponent(metric.key);});
    $('#charts').append(card);drawChart(card.querySelector('.chart-body'),metric);
  }
}
function detail(metric){
  activeMetric=metric;$('#detail-title').textContent=metric.key;$('#detail-description').textContent=metric.description+' Fixed demo observations. Statistics below use raw data.';
  $('#detail-stats').innerHTML=metric.series.map((s,i)=>{const values=s.points.map(p=>p.value);return `<div><strong><i class="dot ${i?'b':'a'}"></i>${s.name}</strong><span>last ${fmt(values.at(-1))}</span><span>Δ ${delta(s.points)}</span><span>min ${fmt(Math.min(...values))}</span><span>max ${fmt(Math.max(...values))}</span><span>mean ${fmt(values.reduce((a,b)=>a+b,0)/values.length)}</span><span>points ${values.length}</span></div>`;}).join('');
  $('#detail-table').innerHTML='<table><caption class="sr-only">Raw observations for '+escapeText(metric.key)+'</caption><thead><tr><th scope="col">run</th><th scope="col">step</th><th scope="col">elapsed min</th><th scope="col">value ('+metric.unit+')</th></tr></thead><tbody>'+metric.series.flatMap(s=>s.points.map(p=>`<tr><td>${s.name}</td><td>${p.step}</td><td>${p.time}</td><td>${p.value.toPrecision(7)}</td></tr>`)).join('')+'</tbody></table>';
  if(!$('#detail').open)$('#detail').showModal();
  drawChart($('#detail-chart'),metric,true);
}
function route(){
  const hash=location.hash.slice(1)||'overview';
  if(hash.startsWith('chart/')){let key;try{key=decodeURIComponent(hash.slice(6));}catch{key='';}const metric=metrics.find(m=>m.key===key);if(metric){detail(metric);return;}location.replace('#metrics');return;}
  if($('#detail').open)$('#detail').close();
  activeMetric=null;const [view,category='']=hash.split('/');state.view=['overview','metrics','about'].includes(view)?view:'overview';state.category=state.view==='metrics'&&metrics.some(m=>m.key.startsWith(category+'/'))?category:'';
  $('#overview').hidden=state.view!=='overview';$('#workspace').hidden=state.view==='about';$('#about').hidden=state.view!=='about';
  $('#explorer').classList.toggle('overview',state.view==='overview');
  document.querySelectorAll('.topbar nav a').forEach(a=>a.setAttribute('aria-current',a.hash==='#'+state.view?'page':'false'));
  const categories=[...new Set(metrics.map(m=>m.key.split('/')[0]))];
  $('#tree').innerHTML=[['',metrics.length],...categories.map(c=>[c,metrics.filter(m=>m.key.startsWith(c+'/')).length])].map(([c,n])=>`<a href="#metrics${c?'/'+c:''}" aria-current="${state.category===c?'page':'false'}"><span>${c?'▸ '+c:'all metrics'}</span><span>${n}</span></a>`).join('');
  $('#crumb').innerHTML=state.view==='overview'?'key metrics <span class="muted">/ two runs</span>':`<a href="#metrics">all</a>${state.category?' / '+escapeText(state.category):''}`;
  renderCharts();
  if(lastTrigger){const key=lastTrigger.dataset.key;document.querySelector(`[data-key="${key}"]`)?.focus({preventScroll:true});lastTrigger=null;}
}
function closeDetail(){if($('#detail').open)$('#detail').close();if(location.hash.startsWith('#chart/'))location.hash=returnRoute;}
$('#close-detail').addEventListener('click',closeDetail);
$('#detail').addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
$('#query').addEventListener('input',e=>{state.query=e.target.value;renderCharts();});
document.querySelectorAll('[data-axis],[data-scale]').forEach(button=>button.addEventListener('click',()=>{const type=button.dataset.axis?'axis':'scale';state[type]=button.dataset[type];document.querySelectorAll(`[data-${type}]`).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderCharts();}));
$('#smooth').addEventListener('input',e=>{state.smooth=Number(e.target.value);$('#smooth-label').textContent=state.smooth?state.smooth+'%':'off';renderCharts();});
function setTheme(theme){document.documentElement.dataset.theme=theme;$('#theme').setAttribute('aria-label',`Switch to ${theme==='dark'?'light':'dark'} theme`);}
try{setTheme(localStorage.getItem('observatory-theme')==='light'?'light':'dark');}catch{setTheme('dark');}
$('#theme').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';setTheme(theme);try{localStorage.setItem('observatory-theme',theme);}catch{/* Theme still works without storage. */}});
$('.skip').addEventListener('click',e=>{e.preventDefault();$('#main').focus();});
window.addEventListener('hashchange',route);
let resizeFrame;
window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{renderCharts();if(activeMetric)drawChart($('#detail-chart'),activeMetric,true);});});
renderRuns();
if(location.hash.startsWith('#chart/')){$('#explorer').classList.add('overview');renderCharts();}
route();
