# Generador de Mapas KML — DABRIXO S.A.C.

Programa web (un solo archivo HTML) que genera mapas **KML** a partir de la **hoja de ruta en Excel**, usando las coordenadas de cada cliente. Genera un mapa por **ruta** (BK35…) y por **viaje** (1, 2, 3…).

## Cómo usarlo

1. Abre la página (o el archivo `index.html` en Chrome).
2. Importa la hoja de ruta (`.xlsx`, `.xls` o `.csv`) arrastrándola o haciendo clic.
3. Cada ruta aparece con sus viajes. Pulsa **Descargar** en el viaje que necesites para bajar su KML (por ejemplo `BK3502_Viaje1.kml`).
4. Abre el KML en **Google Earth** o impórtalo en **Google My Maps**.

## Funciones principales

- Mapa interactivo con fondo de calles o satélite, clientes numerados y recorrido animado.
- Vista general con todas las rutas del día (cada ruta con su color); clic en una línea para abrir el viaje.
- Indicadores: rutas, mapas, clientes, km planificados y cajas a entregar.
- Búsqueda por ruta, placa o cliente; filtros "Varios viajes" y "Pendientes".
- Barra de avance de descargas y tema claro / oscuro.
- Botón **Ver demostración** con datos ficticios para presentar el programa.

## Qué incluye cada mapa

- Un punto por cliente, numerado según la secuencia de visita (inicio en verde, último cliente en rojo).
- Línea del recorrido en el orden de la secuencia (se puede desactivar).
- Datos de cada cliente: código, nombre, tipo, dirección, distrito, hora de llegada y salida, horario de atención, entrega, recojo, distancia, ruta, viaje y vehículo.

## Columnas de la hoja de ruta

El programa detecta las columnas automáticamente: Ruta, Viaje, Sec, Cliente, Código, Dirección, Vehículo, Fecha, Llega, Sale, etc. Las coordenadas se reconocen por sus valores, aunque el encabezado tenga otro nombre (en la hoja de ruta vienen bajo "SKU 2" = longitud y "SKU 3" = latitud). Si algo no cuadra, se puede corregir en **"Columnas detectadas"**.

## Requisitos

- Navegador moderno (Chrome, Edge, Firefox).
- Conexión a internet para cargar el lector de Excel (SheetJS), el mapa (Leaflet) y las tipografías. Sin internet el mapa se reemplaza por un croquis.
- Los datos se procesan en tu navegador y no se envían a ningún servidor.

## Archivos

- `index.html` — el programa completo (diseño, mapa y lógica en un solo archivo).
- `README.md` — estas instrucciones.
- `.gitignore` — evita subir hojas de ruta (.xlsx, .csv) y mapas (.kml) con datos de clientes.
- `codigo-fuente/` — el mismo programa separado en archivos para editarlo cómodo en VS Code:
  - `index.html`, `css/estilos.css`
  - `js/config.js`, `utilidades.js`, `lector-excel.js`, `procesamiento.js`, `kml.js`, `mapa.js`, `interfaz.js`, `demo.js`, `app.js`

  Si cambias algo en `codigo-fuente/`, vuelve a generar el `index.html` principal (o copia los cambios), porque la página publicada usa el `index.html` de la raíz.

## Publicar en GitHub Pages

1. Sube `index.html`, `README.md` y `.gitignore` a un repositorio.
2. En el repositorio entra a **Settings → Pages**.
3. En **Source** elige la rama `main` y la carpeta `/ (root)`, y guarda.
4. La página quedará en `https://<tu-usuario>.github.io/<nombre-del-repo>/`.
