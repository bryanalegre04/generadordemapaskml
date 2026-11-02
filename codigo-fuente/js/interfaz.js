/* =========================================================
 * interfaz.js
 * Indicadores, lista de rutas, detalle del viaje y descargas
 * Generador de Mapas KML - DABRIXO S.A.C.
 * ========================================================= */
"use strict";

let celebrado = false;

function mostrarApp(){
  $('hero').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('btnNew').classList.remove('hidden');
  iniciarMapa();
  setTimeout(() => { if (lmap){ lmap.invalidateSize(); } renderDetail(); }, 60);
}

/* ---------- Todo de una vez (después de procesar) ---------- */
function renderTodo(){
  celebrado = false;
  const total = (k) => groups.reduce((s,g)=>s+(g[k]||0),0);
  animateCount($('kRutas'), new Set(groups.map(g=>g.ruta)).size);
  animateCount($('kMapas'), groups.length);
  animateCount($('kClientes'), groups.reduce((s,g)=>s+g.points.length,0));
  animateCount($('kKm'), total('km'), 1);
  animateCount($('kCajas'), total('cajas'));
  const fecha = (groups[0] && groups[0].fecha) || '';
  $('sFecha').textContent = (esDemo ? 'DEMO · ' : '') + (fecha || 'Sin fecha');
  $('chipDate').classList.add('show');
  renderRoutes(); renderDetail(); updateCount();
}

/* ---------- Lista de rutas ---------- */
function visibleRoutes(){
  const q = norm($('search').value);
  const byRuta = new Map();
  for (const g of groups){
    if (filtro==='pending' && downloaded.has(g.key)) continue;
    if (q && !norm(g.ruta).includes(q) && !norm(g.vehiculo).includes(q) && !g.points.some(p=>norm(p.cliente).includes(q) || norm(p.codigo).includes(q))) continue;
    if (!byRuta.has(g.ruta)) byRuta.set(g.ruta, []);
    byRuta.get(g.ruta).push(g);
  }
  if (filtro==='multi') for (const [r,gs] of byRuta) if (groups.filter(g=>g.ruta===r).length<2) byRuta.delete(r);
  return byRuta;
}

function renderRoutes(){
  const box = $('routes'); box.innerHTML='';
  const byRuta = visibleRoutes();
  const nV = [...byRuta.values()].reduce((s,gs)=>s+gs.length,0);
  $('listInfo').textContent = `${byRuta.size} rutas · ${nV} viajes`;
  if (!byRuta.size){ box.innerHTML='<div class="empty">No hay rutas que coincidan con la búsqueda o el filtro.</div>'; return; }
  let k = 0;
  for (const [ruta, gs] of byRuta){
    const div = document.createElement('div');
    const sel = gs.some(g=>g.key===activeKey);
    div.className = 'route' + (sel?' sel':'');
    div.style.setProperty('--rc', routeColor(gs[0].rutaIdx));
    div.style.animationDelay = Math.min(k++*25, 400)+'ms';
    const total = gs.reduce((s,g)=>s+g.points.length,0);
    div.innerHTML = `<div class="route-top">
        <div><div class="name">${esc(ruta)}</div><div class="veh">${esc(gs[0].vehiculo||'Sin placa')}</div></div>
        <div class="tot"><b class="mono">${total}</b>clientes</div>
      </div>
      <div class="trips">${gs.map(g=>{
        const d = downloaded.has(g.key);
        return `<div class="trip ${g.key===activeKey?'active':''} ${d?'done':''}" data-key="${esc(g.key)}" style="--tc:${tripColor(g.viaje)}">
          <span class="badge">Viaje ${esc(g.viaje)}</span>
          <span class="meta"><span><b>${g.points.length}</b> cl.</span><span><b>${fmtNum(g.km,1)}</b> km</span>${g.inicio?`<span>${esc(g.inicio)}</span>`:''}</span>
          <button class="dl" data-dl="${esc(g.key)}" title="Descargar ${esc(fileName(g))}"><svg class="i" style="width:15px;height:15px"><use href="#i-${d?'check':'download'}"/></svg>${d?'Listo':'Descargar'}</button>
        </div>`; }).join('')}</div>`;
    box.appendChild(div);
  }
}

function seleccionarViaje(key){
  activeKey = key;
  document.querySelectorAll('.trip').forEach(t => t.classList.toggle('active', t.dataset.key===key));
  document.querySelectorAll('.route').forEach(r => r.classList.toggle('sel', !!r.querySelector(`.trip[data-key="${CSS.escape(key||'')}"]`)));
  const t = document.querySelector(`.trip[data-key="${CSS.escape(key||'')}"]`);
  if (t) scrollDentro(document.querySelector('.list-panel'), t);
  renderDetail();
  if (window.innerWidth < 1050) document.querySelector('.detail').scrollIntoView({behavior:'smooth'});
}
function verGeneral(){ activeKey = null; seleccionarViaje(null); }

/* ---------- Detalle (mapa + estadísticas + clientes) ---------- */
function stat(v, k){ return `<div class="stat"><div class="v mono">${v}</div><div class="k">${k}</div></div>`; }

function renderDetail(){
  const g = groups.find(x=>x.key===activeKey);
  const dl = $('btnDl');
  if (!g){
    const gs = [...visibleRoutes().values()].flat();
    $('dTitle').innerHTML = `<span class="sw" style="background:var(--grad)"></span>Vista general`;
    $('dSub').textContent = `Todas las rutas${(groups[0]&&groups[0].fecha)?' del '+groups[0].fecha:''} · cada color es una ruta`;
    $('dStats').innerHTML = stat(new Set(gs.map(x=>x.ruta)).size,'Rutas') + stat(gs.length,'Viajes')
      + stat(fmtNum(gs.reduce((s,x)=>s+x.points.length,0)),'Clientes') + stat(fmtNum(gs.reduce((s,x)=>s+x.km,0),1),'Km');
    $('clients').classList.add('hidden');
    $('btnOverview').classList.add('hidden');
    dl.innerHTML = `<svg class="i"><use href="#i-download"/></svg>KML general`;
    dl.title = 'Un solo KML con todas las rutas visibles (carpetas por ruta y viaje)';
    dibujarGeneral(gs);
    return;
  }
  const c = tripColor(g.viaje);
  $('dTitle').innerHTML = `<span class="sw" style="background:${c}"></span>${esc(g.ruta)} · Viaje ${esc(g.viaje)}`;
  $('dSub').textContent = [g.vehiculo, g.fecha, fileName(g)].filter(Boolean).join(' · ');
  $('dStats').innerHTML = stat(g.points.length,'Clientes') + stat(fmtNum(g.km,1),'Km') + stat(fmtNum(g.cajas),'Cajas entrega')
    + stat(esc(g.inicio||'—'),'Primera llegada') + stat(esc(g.fin||'—'),'Última salida');
  $('btnOverview').classList.remove('hidden');
  const d = downloaded.has(g.key);
  dl.innerHTML = `<svg class="i"><use href="#i-${d?'check':'download'}"/></svg>${d?'Descargar de nuevo':'Descargar KML'}`;
  dl.title = 'Descargar '+fileName(g);

  const n = g.points.length, box = $('clients');
  box.classList.remove('hidden');
  box.style.setProperty('--tc', c);
  box.innerHTML = g.points.map((p,i)=>`<div class="client" data-i="${i}">
      <div class="num ${i===0?'start':(i===n-1&&n>1?'end':'')}">${esc(p.n)}</div>
      <div><div class="nm">${esc(p.cliente||'Cliente')}</div><div class="ad">${esc([p.codigo,p.direccion,p.distrito].filter(Boolean).join(' · '))}</div></div>
      <div class="hr"><b class="mono">${esc(p.llega||'')}</b>${p.entrega?esc(p.entrega)+' cj':''}</div>
    </div>`).join('');
  dibujarViaje(g);
}

/* ---------- Descargas ---------- */
function downloadTrip(g){
  if (!g) return;
  downloadBlob(kmlFor([g], g.ruta+' · Viaje '+g.viaje+(g.fecha?' · '+g.fecha:'')), fileName(g));
  downloaded.add(g.key);
  const t = document.querySelector(`.trip[data-key="${CSS.escape(g.key)}"]`);
  if (t){
    if (filtro==='pending') renderRoutes();
    else { t.classList.add('done'); t.querySelector('.dl').innerHTML = `<svg class="i" style="width:15px;height:15px"><use href="#i-check"/></svg>Listo`; }
  }
  if (g.key===activeKey) renderDetailButton(g);
  updateCount();
}
function renderDetailButton(g){
  $('btnDl').innerHTML = `<svg class="i"><use href="#i-check"/></svg>Descargar de nuevo`;
}
function downloadGeneral(){
  const gs = [...visibleRoutes().values()].flat();
  const f = (groups[0]&&groups[0].fecha)||'';
  downloadBlob(kmlFor(gs, 'DABRIXO S.A.C. · Hoja de ruta '+f), `Hoja_de_Ruta_${f?f.replace(/\//g,'-'):fileBase}.kml`);
}

function updateCount(){
  const n = groups.length, d = groups.filter(g=>downloaded.has(g.key)).length;
  $('dlCount').textContent = `${d} / ${n} descargados`;
  $('pFill').style.width = n ? (d/n*100)+'%' : '0';
  if (n && d===n && !celebrado){ celebrado = true; confetti(); toast('¡Listo! Descargaste los '+n+' mapas'); }
}

/* ---------- Tema claro / oscuro ---------- */
function aplicarTema(t){
  document.documentElement.dataset.theme = t;
  $('btnTheme').innerHTML = `<svg class="i"><use href="#i-${t==='dark'?'sun':'moon'}"/></svg>`;
  try{ localStorage.setItem('kml-tema', t); }catch(e){}
  ponerBase();
}
