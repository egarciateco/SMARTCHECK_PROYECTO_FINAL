const fs = require('fs');
const csv = require('csv-parser');
const format = require('fast-csv');
const NodeGeocoder = require('node-geocoder');

const options = { provider: 'openstreetmap', httpAdapter: 'https' };
const geocoder = NodeGeocoder(options);

const inputFile = 'sucursales.csv';
const outputFile = 'sucursales_reparadas.csv';

const sucursales = [];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para limpiar textos que confunden al mapa (esquinas, cruces, abreviaturas)
function limpiarDireccion(dir) {
  if (!dir) return '';
  return dir
    .replace(/esq\.?\s*[^,]+/gi, '')         // Quita esquinas (ej: "esq. Simón Bolívar")
    .replace(/entre\s+[^y]+y\s+[^,]+/gi, '') // Quita intersecciones ("entre X e Y")
    .replace(/Nro\.?/gi, '')                 // Quita "Nro."
    .replace(/nº/gi, '')                     // Quita "nº"
    .replace(/km\.?\s*\d+/gi, '')            // Simplifica formato de kilómetros si los hay
    .replace(/,\s*,/g, ',')
    .trim()
    .replace(/,+$/, '');
}

console.log('🚀 Iniciando reparación inteligente de coordenadas...');

fs.createReadStream(inputFile)
  .pipe(csv())
  .on('data', (row) => sucursales.push(row))
  .on('end', async () => {
    const ws = fs.createWriteStream(outputFile);
    const csvStream = format.format({ headers: true });
    csvStream.pipe(ws);

    for (let i = 0; i < sucursales.length; i++) {
      let row = sucursales[i];
      console.log(`[${i + 1}/${sucursales.length}] Procesando: ${row.nombre} en ${row.localidad}, ${row.provincia}...`);

      try {
        const direccionLimpia = limpiarDireccion(row.direccion);
        let res = [];

        // Intento 1: Dirección limpia + Localidad + Provincia
        let query1 = `${direccionLimpia}, ${row.localidad}, ${row.provincia}, Argentina`;
        res = await geocoder.geocode(query1);

        // Intento 2 (Fallback): Si falla, prueba solo con la primera parte de la calle principal
        if (res.length === 0 && direccionLimpia.includes(',')) {
          const callePrincipal = direccionLimpia.split(',')[0].trim();
          let query2 = `${callePrincipal}, ${row.localidad}, ${row.provincia}, Argentina`;
          res = await geocoder.geocode(query2);
        }

        // Intento 3 (Fallback de ciudad): Si la dirección específica no existe en el mapa, ubica al menos la ciudad correcta
        if (res.length === 0) {
          let query3 = `${row.localidad}, ${row.provincia}, Argentina`;
          res = await geocoder.geocode(query3);
        }

        if (res.length > 0) {
          row.latitude = res[0].latitude;
          row.longitude = res[0].longitude;
          console.log(`   ✔️ Coordenadas asignadas: ${row.latitude}, ${row.longitude}`);
        } else {
          console.warn(`   ⚠️ No se pudo geolocalizar de ninguna forma esta sucursal.`);
        }
      } catch (err) {
        console.error(`   ❌ Error en fila ${i}:`, err.message);
      }

      csvStream.write(row);
      
      // Pausa de 1.2 segundos para respetar los límites del servidor de mapas
      await sleep(1200);
    }

    csvStream.end();
    console.log(`\n✅ Proceso completado con éxito. Archivo generado: ${outputFile}`);
  });