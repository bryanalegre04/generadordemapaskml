/* =========================================================
 * kml.js
 * Construcción del archivo KML (puntos, estilos y recorrido)
 * Generador de Mapas KML - DABRIXO S.A.C.
 * ========================================================= */
"use strict";

function kmlColor(hex, alpha='ff'){ const h=hex.replace('#',''); return alpha+h.slice(4,6)+h.slice(2,4)+h.slice(0,2); }
function fileName(g){ return `${g.ruta}_Viaje${g.viaje}.kml`.replace(/[\\/:*?"<>|\s]+/g,'_'); }

function kmlFor(gs, docName){
  const line = $('optLine').checked, num = $('optNum').checked;
  const viajes = [...new Set(gs.map(g=>g.viaje))];
  let styles = `<Style id="inicio"><IconStyle><color>ff4ca316</color><scale>1.2</scale><Icon><href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href></Icon></IconStyle><LabelStyle><scale>0.8</scale></LabelStyle></Style>
<Style id="fin"><IconStyle><color>ff2626dc</color><scale>1.2</scale><Icon><href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href></Icon></IconStyle><LabelStyle><scale>0.8</scale></LabelStyle></Style>`;
  for (const v of viajes){
    const c = tripColor(v);
    styles += `
<Style id="pt_v${esc(v)}"><IconStyle><color>${kmlColor(c)}</color><scale>1</scale><Icon><href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon></IconStyle><LabelStyle><scale>0.75</scale></LabelStyle></Style>
<Style id="ln_v${esc(v)}"><LineStyle><color>${kmlColor(c,'cc')}</color><width>3</width></LineStyle></Style>`;
  }
  const folder = g => {
    const n = g.points.length;
    const pm = g.points.map((p,i) => {
      const style = i===0 ? 'inicio' : (i===n-1 && n>1 ? 'fin' : 'pt_v'+g.viaje);
      const name = (num ? p.n+'. ' : '') + (p.cliente || p.codigo || 'Cliente');
      const rows = [['Secuencia',p.n],['Código',p.codigo],['Cliente',p.cliente],['Tipo',p.tipo],['Dirección',p.direccion],['Distrito',p.distrito],
        ['Llega',p.llega],['Sale',p.sale],['Horario',p.abre&&p.cierra?p.abre+' - '+p.cierra:''],['Entrega',p.entrega],['Recojo',p.recojo],['Dist (Km)',p.dist],
        ['Ruta',g.ruta],['Viaje',g.viaje],['Vehículo',g.vehiculo]].filter(r=>r[1]!==''&&r[1]!=null);
      const ext = rows.map(([k,v])=>`<Data name="${esc(k)}"><value>${esc(v)}</value></Data>`).join('');
      return `<Placemark><name>${esc(name)}</name><styleUrl>#${style}</styleUrl><ExtendedData>${ext}</ExtendedData><Point><coordinates>${p.lon},${p.lat},0</coordinates></Point></Placemark>`;
    }).join('\n');
    const ln = line && n>1 ? `\n<Placemark><name>Recorrido ${esc(g.ruta)} V${esc(g.viaje)}</name><styleUrl>#ln_v${esc(g.viaje)}</styleUrl><LineString><tessellate>1</tessellate><coordinates>${g.points.map(p=>p.lon+','+p.lat+',0').join(' ')}</coordinates></LineString></Placemark>` : '';
    return `<Folder><name>${esc(g.ruta)} · Viaje ${esc(g.viaje)}</name><description>${esc('DABRIXO S.A.C. · '+(g.vehiculo?g.vehiculo+' · ':'')+n+' clientes'+(g.fecha?' · '+g.fecha:''))}</description>\n${pm}${ln}\n</Folder>`;
  };
  // Si hay varias rutas, anidar por ruta
  let body;
  const rutas = [...new Set(gs.map(g=>g.ruta))];
  if (rutas.length>1) body = rutas.map(r => `<Folder><name>${esc(r)}</name>\n${gs.filter(g=>g.ruta===r).map(folder).join('\n')}\n</Folder>`).join('\n');
  else body = gs.map(folder).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
<name>${esc(docName)}</name>
${styles}
${body}
</Document>
</kml>`;
}

