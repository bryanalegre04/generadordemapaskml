/* =========================================================
 * mapa.js
 * Mapa interactivo (Leaflet): viaje seleccionado y vista general.
 * Si Leaflet no carga (sin internet) se dibuja un croquis SVG.
 * Generador de Mapas KML - DABRIXO S.A.C.
 * ========================================================= */
"use strict";

let lmap = null;          // instancia del mapa Leaflet
let capaBase = null;      // capa de fondo (calles o satélite)
let capaDatos = null;     // marcadores y líneas actuales
let marcadores = [];      // marcadores del viaje mostrado (para resaltar)
let limites = null;       // área a centrar
let baseActual = 'map';   // map | sat

// Fondos de mapa gratuitos sin clave (Esri). nz = zoom máximo real del servicio
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
const TILES = {
  dark:  {url: ESRI+'Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', nz:16,
          etiquetas: ESRI+'Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', attr:'Mapa &copy; Esri, HERE, Garmin, OpenStreetMap'},
  light: {url: ESRI+'World_Street_Map/MapServer/tile/{z}/{y}/{x}', nz:19, attr:'Mapa &copy; Esri, HERE, Garmin, OpenStreetMap'},
  sat:   {url: ESRI+'World_Imagery/MapServer/tile/{z}/{y}/{x}', nz:19,
          etiquetas: ESRI+'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', attr:'Imágenes &copy; Esri, Maxar, Earthstar Geographics'}
};
const hayLeaflet = () => typeof L !== 'undefined';

function iniciarMapa(){
  if (!hayLeaflet()){ $('map').classList.add('hidden'); $('fallback').classList.remove('hidden'); $('baseSel').classList.add('hidden'); return; }
  if (lmap) return;
  lmap = L.map('map', {zoomControl:true, preferCanvas:false}).setView([-11.95,-77.06], 11);
  const pe = lmap.createPane('etiquetas'); pe.style.zIndex = 350; pe.style.pointerEvents = 'none';  // nombres de calles bajo las rutas
  ponerBase();
}

function ponerBase(){
  if (!lmap) return;
  if (capaBase) lmap.removeLayer(capaBase);
  const tema = document.documentElement.dataset.theme;
  const t = baseActual==='sat' ? TILES.sat : (tema==='light' ? TILES.light : TILES.dark);
  const op = {attribution:t.attr, maxZoom:19, maxNativeZoom:t.nz};
  capaBase = L.layerGroup([L.tileLayer(t.url, op)].concat(t.etiquetas ? [L.tileLayer(t.etiquetas, {maxZoom:19, maxNativeZoom:t.nz, pane:'etiquetas', opacity:.9})] : [])).addTo(lmap);
}

function limpiarMapa(){
  marcadores = [];
  if (capaDatos && lmap) lmap.removeLayer(capaDatos);
  capaDatos = lmap ? L.layerGroup().addTo(lmap) : null;
}

function centrar(){
  if (lmap && limites && limites.isValid()) lmap.fitBounds(limites, {padding:[50,50], maxZoom:16});
}

/* ---------- Contenido de la ventana emergente de cada cliente ---------- */
function popupHtml(g, p, i){
  const n = g.points.length;
  const color = i===0 ? '#22c55e' : (i===n-1 ? '#f43f5e' : tripColor(g.viaje));
  const etiqueta = i===0 ? 'Primer cliente' : (i===n-1 ? 'Último cliente' : 'Cliente');
  const filas = [['Código',p.codigo],['Tipo',p.tipo],['Dirección',p.direccion],['Distrito',p.distrito],
    ['Llega / Sale',[p.llega,p.sale].filter(Boolean).join(' – ')],['Horario',p.abre&&p.cierra?p.abre+' – '+p.cierra:''],
    ['Entrega',p.entrega?p.entrega+' cajas':''],['Recojo',p.recojo?p.recojo+' cajas':''],['Ruta',g.ruta+' · Viaje '+g.viaje]]
    .filter(f=>f[1]);
  return `<div class="pop"><span class="sq" style="background:${color}">#${esc(p.n)} · ${etiqueta}</span>
    <h4>${esc(p.cliente||'Cliente')}</h4>
    <table>${filas.map(f=>`<tr><td>${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join('')}</table></div>`;
}

/* ---------- Un viaje ---------- */
function dibujarViaje(g){
  const linea = $('optLine').checked;
  const color = tripColor(g.viaje), n = g.points.length;
  $('legend').innerHTML = `<span><i style="background:#22c55e"></i>Inicio</span><span><i style="background:${color}"></i>Clientes</span><span><i style="background:#f43f5e"></i>Último</span>`;
  if (!lmap){ croquis([g], true); return; }
  limpiarMapa();
  const latlngs = g.points.map(p=>[p.lat,p.lon]);
  if (linea && n>1){
    L.polyline(latlngs, {color, weight:9, opacity:.22, lineJoin:'round'}).addTo(capaDatos);
    L.polyline(latlngs, {color, weight:3.5, opacity:.95, className:'ruta-anim', lineJoin:'round'}).addTo(capaDatos);
  }
  g.points.forEach((p,i) => {
    const cls = i===0 ? 'start' : (i===n-1 && n>1 ? 'end' : '');
    const icon = L.divIcon({className:'', html:`<div class="pin ${cls}" style="--c:${color}"><span>${esc(p.n)}</span></div>`, iconSize:[28,28], iconAnchor:[14,34], popupAnchor:[0,-30]});
    const m = L.marker([p.lat,p.lon], {icon, zIndexOffset: cls?1000:0, riseOnHover:true}).bindPopup(popupHtml(g,p,i), {maxWidth:300});
    m.on('mouseover', () => resaltarCliente(i, true));
    m.on('mouseout',  () => resaltarCliente(i, false));
    m.on('click',     () => resaltarCliente(i, true, true));
    m.addTo(capaDatos); marcadores.push(m);
  });
  limites = L.latLngBounds(latlngs);
  centrar();
}

/* ---------- Todas las rutas ---------- */
function dibujarGeneral(gs){
  const nR = new Set(gs.map(g=>g.ruta)).size;
  $('legend').innerHTML = `<span>${nR} rutas · ${gs.length} viajes</span><span class="muted" style="font-weight:600">Clic en una línea para abrir el viaje</span>`;
  if (!lmap){ croquis(gs, false); return; }
  limpiarMapa();
  const lienzo = L.canvas({padding:.5});
  const todos = [];
  gs.forEach(g => {
    const color = routeColor(g.rutaIdx);
    const ll = g.points.map(p=>[p.lat,p.lon]); todos.push(...ll);
    g.points.forEach(p => L.circleMarker([p.lat,p.lon], {renderer:lienzo, radius:3, color, weight:1, fillColor:color, fillOpacity:.9}).addTo(capaDatos));
    if (ll.length>1){
      const pl = L.polyline(ll, {color, weight:3, opacity:.8}).addTo(capaDatos);
      pl.bindTooltip(`<b>${esc(g.ruta)}</b> · Viaje ${esc(g.viaje)} · ${g.points.length} clientes`, {sticky:true});
      pl.on('mouseover', () => { pl.setStyle({weight:7, opacity:1}); pl.bringToFront(); });
      pl.on('mouseout',  () => pl.setStyle({weight:3, opacity:.8}));
      pl.on('click',     () => seleccionarViaje(g.key));
    }
  });
  limites = todos.length ? L.latLngBounds(todos) : null;
  centrar();
}

/* ---------- Resaltar / enfocar un cliente ---------- */
function resaltarCliente(i, on, desplazar){
  const m = marcadores[i];
  const pin = m && m.getElement() && m.getElement().querySelector('.pin');
  if (pin) pin.classList.toggle('hl', on);
  const fila = document.querySelector(`.client[data-i="${i}"]`);
  if (fila){
    fila.classList.toggle('hl', on);
    if (on && desplazar) scrollDentro($('clients'), fila);
  }
  document.querySelectorAll(`#fallback circle[data-i="${i}"]`).forEach(c => c.setAttribute('r', on?8:c.dataset.r));
}
function enfocarCliente(i){
  const m = marcadores[i];
  if (!m || !lmap) return;
  lmap.flyTo(m.getLatLng(), Math.max(lmap.getZoom(), 16), {duration:.8});
  setTimeout(() => m.openPopup(), 650);
}

/* ---------- Croquis SVG de respaldo (sin conexión) ---------- */
function croquis(gs, unViaje){
  const W=900, H=520, P=30;
  const pts = gs.flatMap(g=>g.points);
  if (!pts.length){ $('fallback').innerHTML=''; return; }
  const lats=pts.map(p=>p.lat), lons=pts.map(p=>p.lon);
  const minLa=Math.min(...lats), maxLa=Math.max(...lats), minLo=Math.min(...lons), maxLo=Math.max(...lons);
  const k = Math.cos((minLa+maxLa)/2*Math.PI/180);
  const sx=(maxLo-minLo)*k||0.002, sy=(maxLa-minLa)||0.002, s=Math.min((W-2*P)/sx,(H-2*P)/sy);
  const ox=(W-sx*s)/2, oy=(H-sy*s)/2;
  const xy = p => [ (ox+(p.lon-minLo)*k*s).toFixed(1), (H-(oy+(p.lat-minLa)*s)).toFixed(1) ];
  let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;
  gs.forEach(g => {
    const color = unViaje ? tripColor(g.viaje) : routeColor(g.rutaIdx);
    const c = g.points.map(xy);
    if ((!unViaje || $('optLine').checked) && c.length>1)
      svg += `<polyline points="${c.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${unViaje?3:2}" stroke-opacity=".85" stroke-linejoin="round" ${unViaje?'class="ruta-anim"':`style="cursor:pointer" data-key="${esc(g.key)}"`}><title>${esc(g.ruta)} · Viaje ${esc(g.viaje)}</title></polyline>`;
    c.forEach((p,i) => {
      const n=g.points.length, f = unViaje ? (i===0?'#22c55e':(i===n-1?'#f43f5e':color)) : color, r = unViaje ? (i===0||i===n-1?7:5) : 2.5;
      svg += `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" data-r="${r}" ${unViaje?`data-i="${i}"`:''} fill="${f}" stroke="#fff" stroke-width="${unViaje?1.5:0}"><title>${esc(g.points[i].n+'. '+g.points[i].cliente)}</title></circle>`;
    });
  });
  $('fallback').innerHTML = svg + '</svg>';
}
