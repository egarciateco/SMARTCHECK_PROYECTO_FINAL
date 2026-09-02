const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'sucursales.csv');
const backupPath = path.join(__dirname, 'sucursales_backup.csv');

if (!fs.existsSync(filePath)) {
    console.error('❌ No se encontró el archivo sucursales.csv en la carpeta.');
    process.exit(1);
}

// 1. Creamos una copia de seguridad por precaución
fs.copyFileSync(filePath, backupPath);
console.log('🛡️ Copia de seguridad creada con éxito: sucursales_backup.csv');

// 2. Leemos el archivo
const contenido = fs.readFileSync(filePath, 'utf8');
const lineas = contenido.split(/\r?\n/);

const lineasProcesadas = [];

// Encabezado exacto requerido
const encabezadoDeseado = 'supermercado,provincia,localidad,direccion,latitude,longitude';
lineasProcesadas.push(encabezadoDeseado);

let inicioIndex = 0;
if (lineas.length > 0 && (lineas[0].toLowerCase().includes('lat') || lineas[0].toLowerCase().includes('supermercado'))) {
    inicioIndex = 1; // Salta el encabezado antiguo si lo tiene
}

let corregidas = 0;

// 3. Procesamiento inteligente adaptado a las 6 columnas exactas
for (let i = inicioIndex; i < lineas.length; i++) {
    let linea = lineas[i].trim();
    if (!linea) continue;

    let parts = linea.split(',');

    if (parts.length >= 6) {
        const longitude = parts[parts.length - 1].trim();
        const latitude = parts[parts.length - 2].trim();
        const localidad = parts[2].trim();
        const provincia = parts[1].trim();
        const supermercado = parts[0].trim();

        // Todo lo que quedó en el medio (desde el índice 3 hasta antes de lat/lon) son fragmentos de la dirección
        const direccionPartes = parts.slice(3, parts.length - 2);
        const direccionLimpia = direccionPartes.join(', ').trim();

        // Reconstruimos la fila protegiendo los textos con comillas dobles
        const lineaReparada = `"${supermercado}","${provincia}","${localidad}","${direccionLimpia}",${latitude},${longitude}`;

        lineasProcesadas.push(lineaReparada);
        corregidas++;
    } else {
        lineasProcesadas.push(linea);
    }
}

// 4. Guardamos el archivo corregido
fs.writeFileSync(filePath, lineasProcesadas.join('\n'), 'utf8');

console.log(`🎉 ¡Listo! Se procesaron y alinearon correctamente ${corregidas} registros.`);
console.log('🚀 El archivo sucursales.csv ya está perfecto y listo para usarse.');