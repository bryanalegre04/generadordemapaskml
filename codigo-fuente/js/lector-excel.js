/* =========================================================
 * lector-excel.js
 * Lectura del Excel y detección automática de columnas
 * Generador de Mapas KML - DABRIXO S.A.C.
 * ========================================================= */
"use strict";

function load(file){
  if (typeof XLSX === 'undefined'){ alertBox('No se pudo cargar el lector de Excel (requiere internet la primera vez).'); return; }
  fileBase = file.name.replace(/\.[^.]+$/,'').replace(/[^\w\-]+/g,'_');
  const rd = new FileReader();
  rd.onload = e => {
    try{
      const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array', cellDates:true});
      // Elegir la hoja que tenga encabezado "Ruta"
      let best=null;
      for (const name of wb.SheetNames){
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {header:1, raw:true, defval:null});
        const hi = rows.findIndex((r,i)=> i<30 && r && r.some(c=>norm(c)==='ruta'));
        if (hi>=0){ best={name, rows, hi}; break; }
        if (!best) best={name, rows, hi:0};
      }
      const headers = (best.rows[best.hi]||[]).map(h=>h==null?'':String(h));
      const rows = best.rows.slice(best.hi+1).filter(r => r && r.some(c=>c!==null && c!==''));
      const width = Math.max(headers.length, ...rows.map(r=>r.length));
      while (headers.length < width) headers.push('Col '+(headers.length+1));
      esDemo = false;
      iniciarConDatos({headers, rows}, `${file.name} · hoja "${best.name}" · ${rows.length} filas`);
    }catch(err){ console.error(err); alertBox('No se pudo leer el archivo: '+err.message); }
  };
  rd.readAsArrayBuffer(file);
}
function alertBox(msg){ $('fileinfo').innerHTML = '<span class="err">'+esc(msg)+'</span>'; toast(msg); }

// Punto de entrada común para Excel importado y datos de demostración
function iniciarConDatos(datos, info){
  raw = datos;
  $('fileinfo').textContent = info;
  map = detect(raw);
  buildMapping();
  process();
  mostrarApp();
}

/* ---------- Detección de columnas ---------- */
function detect({headers, rows}){
  const H = headers.map(norm);
  const m = {};
  const find = (...tests) => { for (const t of tests){ const i = H.findIndex(h => typeof t==='string' ? h===t : t.test(h)); if (i>=0) return i; } return -1; };
  const sample = rows.slice(0, 400);
  const numericShare = i => { let n=0,t=0; for (const r of sample){ const v=r[i]; if (v===null||v==='') continue; t++; if (!isNaN(toNum(v))) n++; } return t? n/t : 0; };
  const filled = i => sample.filter(r=>r[i]!==null && r[i]!=='').length;

  m.ruta = find('ruta', /^ruta/, /route/);
  m.viaje = find('viaje', /viaje/, /trip/);
  // Secuencia: entre las columnas "Sec" elige la que tenga datos
  const secCols = H.map((h,i)=>/^sec/.test(h)||/secuencia|orden/.test(h)?i:-1).filter(i=>i>=0);
  m.sec = secCols.sort((a,b)=>filled(b)-filled(a))[0] ?? -1;
  if (m.sec>=0 && filled(m.sec)===0) m.sec=-1;

  // Coordenadas: por nombre y validando valores; si no, por valores
  const coordStats = i => {
    let t=0,ok=0,frac=0,sum=0;
    for (const r of sample){ const v=r[i]; if (v===null||v==='') continue; t++; const n=toNum(v); if (!isNaN(n) && Math.abs(n)<=180 && n!==0){ ok++; sum+=Math.abs(n); if (n%1!==0) frac++; } }
    return {t, ok, share: t?ok/t:0, frac: ok?frac/ok:0, mean: ok?sum/ok:0};
  };
  let lat = find('latitud','lat','latitude','y', /latitud/);
  let lon = find('longitud','lon','lng','long','longitude','x', /longitud/);
  const valid = i => { if (i<0) return false; const s=coordStats(i); return s.share>0.8 && s.frac>0.8; };
  if (!(valid(lat) && valid(lon) && coordStats(lat).mean<=90)){
    const cands = H.map((_,i)=>i).filter(i => { const s=coordStats(i); return s.t>0 && s.share>0.9 && s.frac>0.9 && s.mean>0.5; });
    // preferir par contiguo
    let pair=null;
    for (let k=0;k<cands.length-1;k++) if (cands[k+1]===cands[k]+1){ pair=[cands[k],cands[k+1]]; }
    if (!pair && cands.length>=2) pair = cands.slice(-2);
    if (pair){
      const [a,b] = pair, ma=coordStats(a).mean, mb=coordStats(b).mean;
      // la de mayor valor absoluto es longitud (válido para Perú), la latitud debe estar dentro de ±90
      if (ma>=mb){ lon=a; lat=b; } else { lon=b; lat=a; }
      if (coordStats(lat).mean>90){ const t=lat; lat=lon; lon=t; }
    }
  }
  m.lat = lat; m.lon = lon;

  m.cliente = find('cliente','nombre cliente','razon social',/cliente/);
  if (m.cliente>=0 && /tipo/.test(H[m.cliente])) m.cliente = find('cliente');
  m.codigo = find('codigo','cod cliente','idcli',/codigo/);
  m.direccion = find('direccion',/direcc/);
  m.vehiculo = find('vehiculo','placa',/vehic/);
  m.fecha = find('fecha',/fecha/);
  m.tipo = find('tipo cliente',/tipo/);
  m.llega = find('llega'); m.sale = find('sale');
  m.entrega = find('entrega'); m.recojo = find('recojo');
  m.abre = find('abre'); m.cierra = find('cierra');
  m.dist = find('dist (km)', /^dist\b|km/);
  m.distrito = find('distrito', /distrito/);
  if (m.distrito<0){
    // columna de texto pegada a las coordenadas (en la hoja de ruta Backus viene rotulada como "SKU 1")
    const first = Math.min(m.lat, m.lon) - 1;
    if (first>=0 && numericShare(first)<0.2 && filled(first)>0 && !Object.values(m).includes(first)) m.distrito = first;
  }
  return m;
}

function buildMapping(){
  const box = $('mapping'); box.innerHTML='';
  const opts = '<option value="-1">— ninguna —</option>' + raw.headers.map((h,i)=>`<option value="${i}">${esc(colLetter(i))} · ${esc(h||'(sin título)')}</option>`).join('');
  for (const [k,label,req] of FIELDS){
    const l = document.createElement('label'); l.className='f';
    l.innerHTML = `${esc(label)}${req?' *':''}<select data-k="${k}">${opts}</select>`;
    l.querySelector('select').value = String(map[k] ?? -1);
    box.appendChild(l);
  }
  const ok = map.ruta>=0 && map.viaje>=0 && map.lat>=0 && map.lon>=0;
  $('mapDetails').open = !ok;
}
