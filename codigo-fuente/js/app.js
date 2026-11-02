/* =========================================================
 * app.js
 * Conecta los botones y eventos de la pantalla
 * Generador de Mapas KML - DABRIXO S.A.C.
 * ========================================================= */
"use strict";

/* ---------- Tema guardado ---------- */
(() => { let t = 'dark'; try{ t = localStorage.getItem('kml-tema') || 'dark'; }catch(e){} aplicarTema(t); })();
$('btnTheme').addEventListener('click', () => aplicarTema(document.documentElement.dataset.theme==='dark' ? 'light' : 'dark'));

/* ---------- Importar archivo (clic o arrastrar) ---------- */
const drop = $('drop'), fileIn = $('file');
const abrirSelector = () => fileIn.click();
drop.addEventListener('click', abrirSelector);
$('btnPick').addEventListener('click', abrirSelector);
$('btnNew').addEventListener('click', abrirSelector);
$('btnDemo').addEventListener('click', cargarDemo);
['dragover','dragenter'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave','drop'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); if (ev==='drop' || !e.relatedTarget) drop.classList.remove('over'); }));
document.addEventListener('drop', e => { if (e.dataTransfer.files[0]) load(e.dataTransfer.files[0]); });
fileIn.addEventListener('change', () => { if (fileIn.files[0]) load(fileIn.files[0]); fileIn.value=''; });

/* ---------- Columnas ---------- */
$('reprocess').addEventListener('click', () => {
  document.querySelectorAll('#mapping select').forEach(s => map[s.dataset.k] = parseInt(s.value,10));
  process(); toast('Columnas aplicadas');
});

/* ---------- Búsqueda y filtros ---------- */
$('search').addEventListener('input', () => { renderRoutes(); if (!activeKey) renderDetail(); });
$('filter').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  filtro = b.dataset.f;
  $('filter').querySelectorAll('button').forEach(x => x.classList.toggle('on', x===b));
  renderRoutes(); if (!activeKey) renderDetail();
});

/* ---------- Lista de rutas: descargar / seleccionar ---------- */
$('routes').addEventListener('click', e => {
  const dl = e.target.closest('[data-dl]');
  if (dl){ e.stopPropagation(); downloadTrip(groups.find(x=>x.key===dl.dataset.dl)); return; }
  const t = e.target.closest('.trip');
  if (t) seleccionarViaje(t.dataset.key);
});

/* ---------- Lista de clientes ⇄ mapa ---------- */
$('clients').addEventListener('mouseover', e => { const c=e.target.closest('.client'); if (c) resaltarCliente(+c.dataset.i, true); });
$('clients').addEventListener('mouseout',  e => { const c=e.target.closest('.client'); if (c) resaltarCliente(+c.dataset.i, false); });
$('clients').addEventListener('click',     e => { const c=e.target.closest('.client'); if (c) enfocarCliente(+c.dataset.i); });
$('fallback').addEventListener('click', e => { const l=e.target.closest('[data-key]'); if (l) seleccionarViaje(l.dataset.key); });

/* ---------- Botones del detalle ---------- */
$('btnDl').addEventListener('click', () => { const g = groups.find(x=>x.key===activeKey); g ? downloadTrip(g) : downloadGeneral(); });
$('btnOverview').addEventListener('click', verGeneral);
$('btnFit').addEventListener('click', centrar);
$('baseSel').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  baseActual = b.dataset.b;
  $('baseSel').querySelectorAll('button').forEach(x => x.classList.toggle('on', x===b));
  ponerBase();
});
$('optLine').addEventListener('change', renderDetail);

/* ---------- Teclado: Esc vuelve a la vista general ---------- */
document.addEventListener('keydown', e => { if (e.key==='Escape' && activeKey && document.activeElement.tagName!=='INPUT') verGeneral(); });
