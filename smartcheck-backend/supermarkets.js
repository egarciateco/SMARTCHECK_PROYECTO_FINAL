// ✅ Lista de supermercados con ubicación geográfica
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

// ✅ Función para obtener supermercados por código postal
const getSupermarketsByPostalCode = (postalCode) => {
  if (!postalCode) return supermarkets;
  
  return supermarkets.filter(supermarket => 
    supermarket.locations.some(loc => 
      loc.postalCodes.includes(postalCode)
    )
  );
};

// ✅ Función para obtener supermercados por localidad
const getSupermarketsByLocality = (locality, province) => {
  if (!locality) return supermarkets;
  
  return supermarkets.filter(supermarket => 
    supermarket.locations.some(loc => 
      loc.locality.toLowerCase().includes(locality.toLowerCase()) &&
      (!province || loc.province.toLowerCase().includes(province.toLowerCase()))
    )
  );
};

// ✅ Función para verificar si un supermercado está en la zona
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

module.exports = {
  supermarkets,
  getSupermarketsByPostalCode,
  getSupermarketsByLocality,
  isSupermarketInZone,
};