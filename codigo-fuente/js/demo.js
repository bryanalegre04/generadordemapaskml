/* =========================================================
 * demo.js
 * Datos de ejemplo (ficticios) para presentar el programa
 * sin usar información real de clientes.
 * Generador de Mapas KML - DABRIXO S.A.C.
 * ========================================================= */
"use strict";

function generarDemo(){
  // Generador pseudoaleatorio con semilla: la demo siempre se ve igual
  let seed = 20261102;
  const rnd = () => (seed = (seed*1664525 + 1013904223) % 4294967296) / 4294967296;

  const zonas = [
    {d:'COMAS', lat:-11.935, lon:-77.050}, {d:'LOS OLIVOS', lat:-11.968, lon:-77.072},
    {d:'SAN MARTIN DE PORRES', lat:-12.010, lon:-77.085}, {d:'INDEPENDENCIA', lat:-11.993, lon:-77.055},
    {d:'CARABAYLLO', lat:-11.880, lon:-77.030}, {d:'PUENTE PIEDRA', lat:-11.865, lon:-77.075},
    {d:'ANCON', lat:-11.775, lon:-77.155}, {d:'VENTANILLA', lat:-11.875, lon:-77.130}
  ];
  const nombres = ['Bodega','Minimarket','Market','Licorería','Tienda','Distribuidora','Bodeguita','Abarrotes'];
  const apellidos = ['San Juan','El Sol','Doña Rosa','La Esquina','Los Andes','Mi Barrio','El Porvenir','Santa Rosa','La Económica','Don Pepe','Las Flores','El Ahorro'];
  const tipos = ['POC Tradicional','LA Nulo','LA Especial'];
  const placas = ['DMO-101','DMO-202','DMO-303','DMO-404','DMO-505','DMO-606','DMO-707','DMO-808'];
  const fecha = new Date(); fecha.setHours(0,0,0,0);

  const headers = ['Ruta','Vehículo','Fecha','Código','Tipo Cliente','Cliente','Dirección','Abre','Cierra','Viaje','Dist (Km)','Sec','Entrega','Recojo','Llega','Sale','Distrito','Longitud','Latitud'];
  const rows = [];
  zonas.forEach((z, r) => {
    const ruta = 'DEMO' + String(r+1).padStart(2,'0');
    const viajes = r % 3 === 0 ? 2 : 1;
    let min = 7*60 + 30;
    for (let v = 1; v <= viajes; v++){
      const n = 12 + Math.floor(rnd()*18);
      let lat = z.lat + (rnd()-.5)*.01, lon = z.lon + (rnd()-.5)*.01, ang = rnd()*Math.PI*2;
      for (let s = 1; s <= n; s++){
        ang += (rnd()-.5)*1.4;
        const paso = .0015 + rnd()*.003;
        const nLat = lat + Math.sin(ang)*paso, nLon = lon + Math.cos(ang)*paso;
        const dist = s===1 ? 6 + rnd()*10 : haversine({lat,lon},{lat:nLat,lon:nLon});
        lat = nLat; lon = nLon;
        min += Math.round(3 + dist*3);
        const llega = min; min += 6 + Math.floor(rnd()*12);
        const hm = m => pad(Math.floor(m/60)) + ':' + pad(m%60);
        rows.push([ruta, placas[r], fecha, String(13000000 + r*1000 + v*100 + s), tipos[Math.floor(rnd()*3)],
          `${nombres[Math.floor(rnd()*nombres.length)]} ${apellidos[Math.floor(rnd()*apellidos.length)]}`,
          `Av. Ejemplo ${100 + Math.floor(rnd()*900)} Mz ${String.fromCharCode(65+Math.floor(rnd()*20))} Lt ${1+Math.floor(rnd()*30)}`,
          '06:00','23:59', v, dist.toFixed(2), s, 5 + Math.floor(rnd()*50), Math.floor(rnd()*25), hm(llega), hm(min), z.d, lon, lat]);
      }
      min += 60; // regreso al almacén entre viajes
    }
  });
  return {headers, rows};
}

function cargarDemo(){
  esDemo = true;
  fileBase = 'Demo';
  iniciarConDatos(generarDemo(), 'Datos de demostración (ficticios)');
  toast('Demostración cargada con datos ficticios');
}
