const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const csvPath = path.join(__dirname, 'productos.csv');

if (!fs.existsSync(csvPath)) {
  console.error('❌ No se encontró el archivo productos.csv en la ruta:', csvPath);
  process.exit(1);
}

let totalFilas = 0;
let conEan = 0;
let conNombreReal = 0;
let conPrecio = 0;
let conImagen = 0;
let completamenteSanos = 0;

console.log('🔍 Analizando el archivo productos.csv...');

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    totalFilas++;

    const ean = row.ean || row.EAN || row.codigo || '';
    const nombre = row.name || row.nombre || '';
    const precioStr = String(row.precio || row.precioNumerico || row.price || '0').replace(',', '.');
    const precio = parseFloat(precioStr) || 0;
    const imagen = row.imagen || row.image || '';

    // Validaciones individuales
    const tieneEan = ean.trim().length > 5;
    const tieneNombre = nombre.trim().length > 2 && nombre !== 'GENERICO';
    const tienePrecio = precio > 0;
    const tieneImagen = imagen.trim().length > 5;

    if (tieneEan) conEan++;
    if (tieneNombre) conNombreReal++;
    if (tienePrecio) conPrecio++;
    if (tieneImagen) conImagen++;

    if (tieneEan && tieneNombre && tienePrecio && tieneImagen) {
      completamenteSanos++;
    }
  })
  .on('end', () => {
    console.log('\n========================================');
    console.log('📊 REPORTE DE SALUD DE PRODUCTOS.CSV');
    console.log('========================================');
    console.log(`📦 Total de registros en el CSV : ${totalFilas}`);
    console.log(`🏷️ Con código EAN válido        : ${conEan}`);
    console.log(`📝 Con nombre real (no genérico): ${conNombreReal}`);
    console.log(`💰 Con precio mayor a 0         : ${conPrecio}`);
    console.log(`🖼️ Con enlace de imagen         : ${conImagen}`);
    console.log(`✨ Completamente sanos (todo)   : ${completamenteSanos}`);
    console.log('========================================\n');
    console.log('💡 Con estos números sabremos exactamente qué tan depurado está realmente el archivo.');
  })
  .on('error', (err) => {
    console.error('❌ Error al leer el CSV:', err.message);
  });