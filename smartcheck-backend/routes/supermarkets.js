const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Función de Haversine para calcular distancia en kilómetros entre dos coordenadas
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
}

// Parser seguro de CSV para manejar comillas y comas internas en direcciones
function parseCSVLine(text) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
}

// ✅ Lista de supermercados con ubicación geográfica (respaldo)
const supermarkets = [
  {
    id: 1,
    name: 'Coto',
    displayName: 'Coto Centro Mayorista',
    logo: 'https://via.placeholder.com/100/0047AB/ffffff?text=Coto',
    color: '#0047AB',
    locations: [
      { locality: 'Buenos Aires', province: 'Buenos Aires', postalCodes: ['1406', '1407', '1408', '1416', '1417', '1419', '1424', '1425', '1426', '1427', '1428', '1429', '1430', '1431', '1432', '1433', '1434', '1435', '1436', '1437', '1438', '1439'] },
      { locality: 'La Matanza', province: 'Buenos Aires', postalCodes: ['1754', '1755', '1756', '1757', '1758'] },
      { locality: 'San Martín', province: 'Buenos Aires', postalCodes: ['1650', '1651', '1652', '1653', '1654', '1655', '1656', '1657', '1658', '1659'] },
    ],
  },
  {
    id: 2,
    name: 'Carrefour',
    displayName: 'Carrefour Argentina',
    logo: 'https://via.placeholder.com/100/0055A4/ffffff?text=Carrefour',
    color: '#0055A4',
    locations: [
      { locality: 'Buenos Aires', province: 'Buenos Aires', postalCodes: ['1406', '1407', '1408', '1416', '1417', '1419', '1424', '1425', '1426', '1427', '1428', '1429', '1430', '1431', '1432', '1433', '1434', '1435', '1436', '1437', '1438', '1439'] },
      { locality: 'Córdoba', province: 'Córdoba', postalCodes: ['5000', '5001', '5002', '5003', '5004', '5005', '5006', '5007', '5008', '5009', '5010', '5012', '5013', '5014', '5015', '5016'] },
      { locality: 'Rosario', province: 'Santa Fe', postalCodes: ['2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009'] },
    ],
  },
  {
    id: 3,
    name: 'Jumbo',
    displayName: 'Jumbo Argentina',
    logo: 'https://via.placeholder.com/100/E30613/ffffff?text=Jumbo',
    color: '#E30613',
    locations: [
      { locality: 'Buenos Aires', province: 'Buenos Aires', postalCodes: ['1406', '1407', '1408', '1416', '1417', '1419', '1424', '1425', '1426', '1427', '1428', '1429', '1430', '1431', '1432', '1433', '1434', '1435', '1436', '1437', '1438', '1439'] },
      { locality: 'Vicente López', province: 'Buenos Aires', postalCodes: ['1602', '1603', '1604', '1605', '1606', '1607', '1608', '1609'] },
      { locality: 'San Isidro', province: 'Buenos Aires', postalCodes: ['1609', '1610', '1611', '1612', '1613', '1614', '1615'] },
    ],
  },
  {
    id: 4,
    name: 'Walmart',
    displayName: 'Walmart Argentina',
    logo: 'https://via.placeholder.com/100/0071CE/ffffff?text=Walmart',
    color: '#0071CE',
    locations: [
      { locality: 'Buenos Aires', province: 'Buenos Aires', postalCodes: ['1406', '1407', '1408', '1416', '1417', '1419', '1424', '1425', '1426', '1427', '1428', '1429', '1430', '1431', '1432', '1433', '1434', '1435', '1436', '1437', '1438', '1439'] },
      { locality: 'La Matanza', province: 'Buenos Aires', postalCodes: ['1754', '1755', '1756', '1757', '1758'] },
    ],
  },
  {
    id: 5,
    name: 'Disco',
    displayName: 'Disco Argentina',
    logo: 'https://via.placeholder.com/100/009B4D/ffffff?text=Disco',
    color: '#009B4D',
    locations: [
      { locality: 'Buenos Aires', province: 'Buenos Aires', postalCodes: ['1406', '1407', '1408', '1416', '1417', '1419', '1424', '1425', '1426', '1427', '1428', '1429', '1430', '1431', '1432', '1433', '1434', '1435', '1436', '1437', '1438', '1439'] },
      { locality: 'Palermo', province: 'Buenos Aires', postalCodes: ['1414', '1425', '1426'] },
      { locality: 'Recoleta', province: 'Buenos Aires', postalCodes: ['1425', '1426', '1428'] },
    ],
  },
  {
    id: 6,
    name: 'Vital',
    displayName: 'Vital Supermercados',
    logo: 'https://via.placeholder.com/100/FF6600/ffffff?text=Vital',
    color: '#FF6600',
    locations: [
      { locality: 'Buenos Aires', province: 'Buenos Aires', postalCodes: ['1406', '1407', '1408', '1416', '1417', '1419', '1424', '1425', '1426', '1427', '1428', '1429', '1430', '1431', '1432', '1433', '1434', '1435', '1436', '1437', '1438', '1439'] },
    ],
  },
  {
    id: 7,
    name: 'Changomas',
    displayName: 'Changomas Mayorista',
    logo: 'https://via.placeholder.com/100/FF0000/ffffff?text=Changomas',
    color: '#FF0000',
    locations: [
      { locality: 'Buenos Aires', province: 'Buenos Aires', postalCodes: ['1406', '1407', '1408', '1416', '1417', '1419', '1424', '1425', '1426', '1427', '1428', '1429', '1430', '1431', '1432', '1433', '1434', '1435', '1436', '1437', '1438', '1439'] },
      { locality: 'La Matanza', province: 'Buenos Aires', postalCodes: ['1754', '1755', '1756', '1757', '1758'] },
    ],
  },
  {
    id: 8,
    name: 'Maxiconsumo',
    displayName: 'Maxiconsumo Mayorista',
    logo: 'https://via.placeholder.com/100/0066CC/ffffff?text=Maxiconsumo',
    color: '#0066CC',
    locations: [
      { locality: 'Buenos Aires', province: 'Buenos Aires', postalCodes: ['1406', '1407', '1408', '1416', '1417', '1419', '1424', '1425', '1426', '1427', '1428', '1429', '1430', '1431', '1432', '1433', '1434', '1435', '1436', '1437', '1438', '1439'] },
      { locality: 'Quilmes', province: 'Buenos Aires', postalCodes: ['1878', '1879', '1880', '1881', '1882', '1883', '1884', '1885', '1886', '1887', '1888'] },
    ],
  },
];

const getSupermarketsByPostalCode = (postalCode) => {
  if (!postalCode) return supermarkets;
  return supermarkets.filter(supermarket => 
    supermarket.locations.some(loc => 
      loc.postalCodes.includes(postalCode)
    )
  );
};

const getSupermarketsByLocality = (locality, province) => {
  if (!locality) return supermarkets;
  return supermarkets.filter(supermarket => 
    supermarket.locations.some(loc => 
      loc.locality.toLowerCase().includes(locality.toLowerCase()) &&
      (!province || loc.province.toLowerCase().includes(province.toLowerCase()))
    )
  );
};

const isSupermarketInZone = (supermarketId, postalCode, locality, province) => {
  const supermarket = supermarkets.find(s => s.id === supermarketId);
  if (!supermarket) return false;
  if (postalCode) {
    return supermarket.locations.some(loc => loc.postalCodes.includes(postalCode));
  }
  if (locality) {
    return supermarket.locations.some(loc => 
      loc.locality.toLowerCase().includes(locality.toLowerCase()) &&
      (!province || loc.province.toLowerCase().includes(province.toLowerCase()))
    );
  }
  return true;
};

// --- ENDPOINTS HTTP DEL ROUTER ---

router.get('/cercanos', (req, res) => {
    try {
        const { lat, lng } = req.query;
        
        // 🔎 LOG DE DEPURACIÓN: Ver qué coordenadas manda el celular
        console.log(`📍 Coordenadas recibidas del cliente -> Lat: "${lat}", Lng: "${lng}"`);

        const usuarioLat = parseFloat(lat) || -31.7333; 
        const usuarioLng = parseFloat(lng) || -60.5333;

        console.log(`🎯 Coordenadas usadas para el cálculo -> Lat: ${usuarioLat}, Lng: ${usuarioLng}`);

        const filePath = path.join(__dirname, '../sucursales.csv');

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'El archivo sucursales.csv no se encuentra en el servidor.' 
            });
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lineas = fileContent.split('\n');
        const sucursales = [];

        // Omitimos la cabecera (empezamos en i = 1)
        for (let i = 1; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            if (!linea) continue;

            const columnas = parseCSVLine(linea);
            if (columnas.length < 7) continue;

            const [cadena, nombre, direccion, localidad, provincia, latSuc, lngSuc] = columnas;

            if (latSuc && lngSuc) {
                const latNum = parseFloat(latSuc);
                const lngNum = parseFloat(lngSuc);

                if (!isNaN(latNum) && !isNaN(lngNum)) {
                    const distanciaKm = calcularDistanciaKm(usuarioLat, usuarioLng, latNum, lngNum);

                    sucursales.push({
                        id: i.toString(),
                        cadena: cadena || 'Supermercado',
                        nombre: nombre || `${cadena} - ${localidad}`,
                        direccion: direccion ? `${direccion}, ${localidad}` : localidad,
                        localidad,
                        provincia,
                        latitude: latNum,
                        longitude: lngNum,
                        distanciaKm: distanciaKm,
                        distancia: distanciaKm < 1 ? `${Math.round(distanciaKm * 1000)} mts` : `${distanciaKm} km`
                    });
                }
            }
        }

        // Ordenar de menor a mayor distancia estrictamente
        sucursales.sort((a, b) => a.distanciaKm - b.distanciaKm);

        return res.json({
            status: 'success',
            data: sucursales.slice(0, 15) // Devuelve las 15 sucursales más cercanas
        });

    } catch (error) {
        console.error('Error al procesar sucursales.csv:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

router.get('/', (req, res) => {
  try {
    const { postalCode, locality, province } = req.query;
    if (postalCode) {
      return res.json({ status: 'éxito', supermarkets: getSupermarketsByPostalCode(postalCode) });
    }
    if (locality) {
      return res.json({ status: 'éxito', supermarkets: getSupermarketsByLocality(locality, province) });
    }
    return res.json({ status: 'éxito', supermarkets });
  } catch (error) {
    return res.status(500).json({ status: 'error', mensaje: error.message });
  }
});

router.get('/check/:id', (req, res) => {
  try {
    const supermarketId = parseInt(req.params.id);
    const { postalCode, locality, province } = req.query;
    const inZone = isSupermarketInZone(supermarketId, postalCode, locality, province);
    return res.json({ status: 'éxito', inZone });
  } catch (error) {
    return res.status(500).json({ status: 'error', mensaje: error.message });
  }
});

// Adjuntar las funciones al router para mantener compatibilidad con otras rutas
router.supermarkets = supermarkets;
router.getSupermarketsByPostalCode = getSupermarketsByPostalCode;
router.getSupermarketsByLocality = getSupermarketsByLocality;
router.isSupermarketInZone = isSupermarketInZone;

module.exports = router;