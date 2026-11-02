/* =========================================================
 * utilidades.js
 * Funciones de ayuda: texto, números, fechas, avisos y descargas
 * Generador de Mapas KML - DABRIXO S.A.C.
 * ========================================================= */
"use strict";

const norm = s => String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const toNum = v => { if (typeof v === 'number') return v; if (v==null) return NaN; const s=String(v).trim().replace(',', '.'); return s===''?NaN:Number(s); };
function toast(msg){ const t=$('toast'); $('toastMsg').textContent=msg; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2400); }

// Formato de números al estilo Perú (1,946 · 15.3)
const fmtNum = (n, dec=0) => Number(n||0).toLocaleString('es-PE',{minimumFractionDigits:dec,maximumFractionDigits:dec});

// Contador animado para los indicadores
function animateCount(el, to, dec=0){
  const from = 0, t0 = performance.now(), dur = 900;
  const step = t => { const k=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-k,3); el.textContent = fmtNum(from+(to-from)*e, dec); if (k<1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// Distancia en km entre dos puntos (fórmula de Haversine)
function haversine(a, b){
  const R=6371, r=x=>x*Math.PI/180, dLa=r(b.lat-a.lat), dLo=r(b.lon-a.lon);
  const h=Math.sin(dLa/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLo/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

// Lluvia de confeti al completar todas las descargas
function confetti(){
  const colors=['#3b82f6','#8b5cf6','#22d3ee','#fbbf24','#f43f5e','#22c55e'];
  for (let i=0;i<90;i++){
    const d=document.createElement('div'); d.className='confetti';
    d.style.left=Math.random()*100+'vw'; d.style.background=colors[i%colors.length];
    d.style.animationDuration=(1.8+Math.random()*1.8)+'s'; d.style.animationDelay=(Math.random()*.4)+'s';
    d.style.transform=`rotate(${Math.random()*360}deg)`;
    document.body.appendChild(d); setTimeout(()=>d.remove(),4200);
  }
}

function colLetter(i){ let s=''; i++; while(i>0){ const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26);} return s; }

function fmtVal(v){
  if (v==null) return '';
  if (v instanceof Date){
    if (v.getFullYear()<1901){ return pad(v.getHours())+':'+pad(v.getMinutes()); }
    return pad(v.getDate())+'/'+pad(v.getMonth()+1)+'/'+v.getFullYear();
  }
  return String(v).trim();
}
function fmtTime(v){
  if (typeof v==='number' && v>=0 && v<1){ const m=Math.round(v*1440); return pad(Math.floor(m/60))+':'+pad(m%60); }
  return fmtVal(v);
}
const pad = n => String(n).padStart(2,'0');

function downloadBlob(content, name){
  const blob = content instanceof Blob ? content : new Blob([content], {type:'application/vnd.google-earth.kml+xml'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  toast('Descargado: '+name);
}

// Desplaza un contenedor con scroll para mostrar un elemento, sin mover la página
function scrollDentro(cont, el){
  if (!cont || !el || cont.scrollHeight <= cont.clientHeight) return;
  const r = el.getBoundingClientRect(), c = cont.getBoundingClientRect();
  if (r.top < c.top || r.bottom > c.bottom) cont.scrollTo({top: cont.scrollTop + (r.top - c.top) - c.height/3, behavior:'smooth'});
}
