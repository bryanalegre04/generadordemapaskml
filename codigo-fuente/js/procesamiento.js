/* =========================================================
 * procesamiento.js
 * Agrupa los clientes por ruta y viaje, y ordena por secuencia
 * Generador de Mapas KML - DABRIXO S.A.C.
 * ========================================================= */
"use strict";

function process(){
  const warn = [];
  if (map.ruta<0) warn.push('No se encontró la columna "Ruta".');
  if (map.viaje<0) warn.push('No se encontró la columna "Viaje" (se tomará todo como viaje 1).');
  if (map.lat<0 || map.lon<0) warn.push('No se encontraron las columnas de coordenadas. Indícalas en "Columnas detectadas".');
  const get = (r,k) => map[k]>=0 ? r[map[k]] : null;
  const byKey = new Map(); skipped = 0; const skippedList=[];
  raw.rows.forEach((r, idx) => {
    const ruta = fmtVal(get(r,'ruta'));
    if (!ruta) return;
    const viaje = map.viaje>=0 ? (fmtVal(get(r,'viaje')) || '1') : '1';
    const lat = toNum(get(r,'lat')), lon = toNum(get(r,'lon'));
    const okc = !isNaN(lat) && !isNaN(lon) && Math.abs(lat)<=90 && Math.abs(lon)<=180 && !(lat===0 && lon===0);
    if (!okc){ skipped++; if (skippedList.length<6) skippedList.push(`${ruta} V${viaje} · ${fmtVal(get(r,'cliente'))||('fila '+(idx+2))}`); return; }
    const key = ruta+'|'+viaje;
    if (!byKey.has(key)) byKey.set(key, {key, ruta, viaje, vehiculo: fmtVal(get(r,'vehiculo')), fecha: fmtVal(get(r,'fecha')), points: []});
    const g = byKey.get(key);
    if (!g.vehiculo) g.vehiculo = fmtVal(get(r,'vehiculo'));
    const secN = toNum(get(r,'sec'));
    g.points.push({
      order: idx, sec: isNaN(secN)?null:secN, lat, lon,
      cliente: fmtVal(get(r,'cliente')), codigo: fmtVal(get(r,'codigo')), direccion: fmtVal(get(r,'direccion')),
      distrito: fmtVal(get(r,'distrito')), tipo: fmtVal(get(r,'tipo')),
      llega: fmtTime(get(r,'llega')), sale: fmtTime(get(r,'sale')),
      abre: fmtTime(get(r,'abre')), cierra: fmtTime(get(r,'cierra')),
      entrega: fmtVal(get(r,'entrega')), recojo: fmtVal(get(r,'recojo')), dist: fmtVal(get(r,'dist'))
    });
  });
  groups = [...byKey.values()];
  groups.forEach(g => {
    g.points.sort((a,b) => (a.sec??1e9)-(b.sec??1e9) || a.order-b.order);
    g.points.forEach((p,i) => p.n = p.sec ?? (i+1));
  });
  const cmp = (a,b) => a.localeCompare(b, 'es', {numeric:true});
  groups.sort((a,b) => cmp(a.ruta,b.ruta) || cmp(a.viaje,b.viaje));
  if (skipped) warn.push(`${skipped} cliente(s) sin coordenadas válidas no se incluyeron` + (skippedList.length? ': '+skippedList.join('; ')+(skipped>skippedList.length?'…':'') : '.'));

  // Indicadores por viaje: km, cajas, primera llegada y última salida
  const rutas = [...new Set(groups.map(g=>g.ruta))];
  groups.forEach(g => {
    const kmHoja = g.points.reduce((s,p)=>{ const n=toNum(p.dist); return s+(isNaN(n)?0:n); },0);
    let kmLinea = 0; for (let i=1;i<g.points.length;i++) kmLinea += haversine(g.points[i-1], g.points[i]);
    g.km = kmHoja>0 ? kmHoja : kmLinea;
    g.cajas = g.points.reduce((s,p)=>{ const n=toNum(p.entrega); return s+(isNaN(n)?0:n); },0);
    g.inicio = g.points[0] ? (g.points[0].llega||'') : '';
    g.fin = g.points.length ? (g.points[g.points.length-1].sale||'') : '';
    g.rutaIdx = rutas.indexOf(g.ruta);
  });

  $('warn').innerHTML = warn.map(esc).join('<br>'); $('warn').classList.toggle('hidden', !warn.length);
  downloaded.clear();
  activeKey = null;          // empezar en la vista general
  renderTodo();
}

