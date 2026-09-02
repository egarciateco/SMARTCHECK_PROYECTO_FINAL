const fs = require('fs');
const path = require('path');
const https = require('https');

const filePath = path.join(__dirname, 'sucursales.csv');

if (!fs.existsSync(filePath)) {
    console.error('❌ No se encontró el archivo sucursales.csv');
    process.exit(1);
}

const fileContent = fs.readFileSync(filePath, 'utf-8');
const lineas = fileContent.split('\n');

// Función para pausar entre peticiones (para no saturar la API gratuita de OpenStreetMap)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function obtenerCoordenadas(direccion, localidad, provincia) {
    return new Promise((resolve) => {
        const query = encodeURIComponent(`${direccion}, ${localidad}, ${provincia}, Argentina`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

        const options = {
            headers: {
                'User-Agent': 'SmartCheckApp/1.0 (contacto@smartcheck.com)'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json && json.length > 0) {
                        resolve({ lat: json[0].lat, lng: json[0].lon });
                    } else {
                        // Si falla la dirección exacta, intentamos solo con la localidad
                        obtenerCoordenadasLocalidad(localidad, provincia, resolve);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => {
            resolve(null);
        });
    });
}

function obtenerCoordenadasLocalidad(localidad, provincia, resolve) {
    const query = encodeURIComponent(`${localidad}, ${provincia}, Argentina`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    const options = { headers: { 'User-Agent': 'SmartCheckApp/1.0' } };

    https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json && json.length > 0) {
                    resolve({ lat: json[0].lat, lng: json[0].lon });
                } else {
                    // Valor por defecto si no encuentra nada (ej: centro de Paraná o BsAs)
                    resolve({ lat: '-31.7333', lng: '-60.5333' });
                }
            } catch (e) {
                resolve({ lat: '-31.7333', lng: '-60.5333' });
            }
        });
    }).on('error', () => {
        resolve({ lat: '-31.7333', lng: '-60.5333' });
    });
}

async function procesarCSV() {
    console.log('🚀 Iniciando geocodificación de sucursales...');
    let nuevoCSV = 'cadena,nombre,direccion,localidad,provincia,lat,lng\n';

    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;

        // Asumimos el orden actual: cadena,nombre,direccion,localidad,provincia (sin lat y lng)
        const partes = linea.split(',');
        const cadena = partes[0] || '';
        const nombre = partes[1] || '';
        const direccion = partes[2] || '';
        const localidad = partes[3] || '';
        const provincia = partes[4] || '';

        console.log(`🔍 Buscando coordenadas para: ${nombre} (${localidad}, ${provincia})...`);
        const coords = await obtenerCoordenadas(direccion, localidad, provincia);
        
        if (coords) {
            nuevoCSV += `${cadena},${nombre},${direccion},${localidad},${provincia},${coords.lat},${coords.lng}\n`;
        } else {
            nuevoCSV += `${cadena},${nombre},${direccion},${localidad},${provincia},-31.7333,-60.5333\n`;
        }

        // Esperar 1 segundo entre cada petición para cumplir políticas de la API abierta
        await sleep(1000);
    }

    fs.writeFileSync(filePath, nuevoCSV, 'utf-8');
    console.log('✅ ¡Archivo sucursales.csv actualizado exitosamente con coordenadas (lat, lng)!');
}

procesarCSV();