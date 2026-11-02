/* =========================================================
 * config.js
 * Configuración y estado global del programa
 * Generador de Mapas KML - DABRIXO S.A.C.
 * ========================================================= */
"use strict";

// Atajo para obtener elementos por id
const $ = id => document.getElementById(id);

// Colores por número de viaje (Viaje 1 azul, Viaje 2 naranja, Viaje 3 verde...)
const TRIP_COLORS = ['#3b82f6','#f97316','#10b981','#a855f7','#ef4444','#06b6d4','#eab308','#ec4899'];
const tripColor = v => TRIP_COLORS[(Math.max(1, parseInt(v,10)||1) - 1) % TRIP_COLORS.length];

// Color propio de cada ruta (para la vista general): tonos repartidos con el "ángulo dorado"
const routeColor = i => `hsl(${Math.round((i*137.508)%360)} 85% 58%)`;

// Estado de la aplicación
let raw = null;        // {headers:[], rows:[[]]}
let map = {};          // field -> column index
let groups = [];       // [{ruta, viaje, vehiculo, fecha, points:[]}]
let skipped = 0;
let activeKey = null;
const downloaded = new Set();
let fileBase = 'Hoja_de_Ruta';
let filtro = 'all';    // all | multi | pending
let esDemo = false;

// Campos que se buscan en la hoja de ruta: [clave, etiqueta, obligatorio]
const FIELDS = [
  ['ruta','Ruta',true], ['viaje','Viaje',true], ['sec','Secuencia',false],
  ['lat','Latitud',true], ['lon','Longitud',true],
  ['cliente','Cliente',false], ['codigo','Código cliente',false], ['direccion','Dirección',false],
  ['distrito','Distrito',false], ['vehiculo','Vehículo',false], ['fecha','Fecha',false],
  ['tipo','Tipo cliente',false], ['llega','Llega',false], ['sale','Sale',false],
  ['entrega','Entrega',false], ['recojo','Recojo',false], ['abre','Abre',false], ['cierra','Cierra',false], ['dist','Dist (Km)',false]
];
