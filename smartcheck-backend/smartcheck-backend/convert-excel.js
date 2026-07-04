const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// ✅ RUTA DEL EXCEL - Ajustar según donde esté tu archivo
// Opción 1: Si está en src/data/
const excelPath = path.join(__dirname, '..', 'Users', 'usuario', 'smartcheck-app', 'src', 'data', 'productos.xlsx');

// Opción 2: Si está en datos_raw/
// const excelPath = path.join(__dirname, '..', 'Users', 'usuario', 'smartcheck-app', 'datos_raw', 'productos.xlsx');

// Opción 3: Ruta directa (modificar con tu ruta real)
// const excelPath = 'C:\\Users\\usuario\\smartcheck-app\\src\\data\\productos.xlsx';

const jsonPath = path.join(__dirname, 'products.json');

console.log('📊 Convirtiendo Excel a JSON...');
console.log('📁 Origen:', excelPath);
console.log('📄 Destino:', jsonPath);

// Verificar si el archivo Excel existe
if (!fs.existsSync(excelPath)) {
  console.error('❌ No se encontró el archivo Excel en:', excelPath);
  console.error('\n💡 Buscando archivos Excel en el proyecto...');
  
  const searchPaths = [
    path.join(__dirname, '..', 'Users', 'usuario', 'smartcheck-app', 'src', 'data'),
    path.join(__dirname, '..', 'Users', 'usuario', 'smartcheck-app', 'datos_raw'),
    path.join(__dirname, '..', 'Users', 'usuario', 'smartcheck-app'),
    'C:\\Users\\usuario\\smartcheck-app\\src\\data',
    'C:\\Users\\usuario\\smartcheck-app\\datos_raw',
  ];
  
  searchPaths.forEach(p => {
    if (fs.existsSync(p)) {
      const files = fs.readdirSync(p).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
      if (files.length > 0) {
        console.log(`📁 En ${p}:`);
        files.forEach(f => console.log(`   - ${f}`));
      }
    }
  });
  
  process.exit(1);
}

// Leer el archivo Excel
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log(`📋 Hoja encontrada: ${sheetName}`);

// Convertir a JSON
const rawData = XLSX.utils.sheet_to_json(worksheet);

console.log(`📦 Filas encontradas: ${rawData.length}`);

// Mostrar nombres de columnas del Excel
if (rawData.length > 0) {
  console.log('\n🔍 Columnas encontradas en el Excel:');
  Object.keys(rawData[0]).forEach(col => {
    console.log(`   - "${col}"`);
  });
}

// Mapear campos del Excel a campos del sistema
const products = rawData.map((row, index) => {
  // ✅ MAPEO DE CAMPOS - Busca coincidencias insensibles a mayúsculas
  const getColumn = (possibleNames) => {
    for (const name of possibleNames) {
      const key = Object.keys(row).find(k => k.toUpperCase().trim() === name.toUpperCase().trim());
      if (key) return row[key];
    }
    return null;
  };

  const product = {
    id: String(getColumn(['ID', 'id', '#', 'NRO', 'NUMERO']) || index + 1),
    name: String(getColumn(['PRODUCTO', 'Producto', 'nombre', 'Name', 'DESCRIPCION', 'Descripcion']) || 'Sin nombre'),
    ean: String(getColumn(['CODIGO EAN', 'CODIGO EAN', 'EAN', 'ean', 'Barcode', 'barcode', 'CODIGO', 'Codigo', 'CÓDIGO']) || ''),
    price: Number(getColumn(['PRECIO', 'Precio', 'price', 'Price', 'PRECIO VENTA', 'Precio Venta']) || 0),
    originalPrice: Number(getColumn(['PRECIO ORIGINAL', 'Precio Original', 'originalPrice', 'PRECIO LISTA', 'Precio Lista', 'PRECIO ANTERIOR']) || 0),
    discount: Number(getColumn(['DESCUENTO', 'Descuento', 'discount', 'OFF', 'AHORRO']) || 0),
    supermarket: String(getColumn(['SUPERMERCADO', 'Supermercado', 'supermarket', 'Local', 'local', 'TIENDA', 'Tienda', 'COMERCIO']) || 'Sin supermercado'),
    category: String(getColumn(['CATEGORIA', 'Categoria', 'Categoría', 'category', 'Category', 'RUBRO', 'Rubro', 'FAMILIA', 'Familia']) || 'General'),
    brand: String(getColumn(['MARCA', 'Marca', 'brand', 'Brand', 'LABORATORIO', 'Laboratorio']) || ''),
    image: String(getColumn(['IMAGEN', 'Imagen', 'image', 'Image', 'FOTO', 'Foto', 'foto', 'URL_IMAGEN', 'URL IMAGEN']) || ''),
    inStock: getColumn(['STOCK', 'stock', 'DISPONIBLE', 'Disponible', 'ESTADO']) !== 'Sin stock' && getColumn(['STOCK', 'stock']) !== 0,
  };

  // ✅ Limpiar y formatear EAN (quitar espacios, guiones, puntos, etc.)
  product.ean = product.ean ? String(product.ean).replace(/[^0-9]/g, '') : '';
  
  // ✅ Si no hay originalPrice, usar price como base
  if (product.originalPrice === 0) {
    product.originalPrice = product.price;
  }
  
  // ✅ Calcular descuento si no viene en el Excel
  if (product.discount === 0 && product.originalPrice > 0 && product.price > 0 && product.originalPrice > product.price) {
    product.discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }

  // ✅ Si no hay imagen, usar placeholder
  if (!product.image || product.image.trim() === '') {
    product.image = `https://via.placeholder.com/150/001f3f/ffffff?text=${encodeURIComponent(product.name.substring(0, 20))}`;
  }

  return product;
});

// Filtrar productos sin nombre válido
const validProducts = products.filter(p => p.name && p.name !== 'Sin nombre');

console.log(`\n✅ Productos válidos: ${validProducts.length}/${products.length}`);

// ✅ Verificar cuántos tienen EAN
const productsWithEan = validProducts.filter(p => p.ean && p.ean !== '');
console.log(`📦 Productos con EAN: ${productsWithEan.length}/${validProducts.length}`);

// Mostrar ejemplos
if (validProducts.length > 0) {
  console.log('\n🔍 Ejemplos de productos convertidos:');
  validProducts.slice(0, 5).forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.name}`);
    console.log(`   EAN: ${p.ean || '⚠️ Sin EAN'}`);
    console.log(`   Precio: $${p.price}`);
    console.log(`   Original: $${p.originalPrice}`);
    console.log(`   Descuento: ${p.discount}%`);
    console.log(`   Supermercado: ${p.supermarket}`);
    console.log(`   Categoría: ${p.category}`);
    console.log(`   Marca: ${p.brand || 'Sin marca'}`);
  });
}

// Guardar en JSON
fs.writeFileSync(jsonPath, JSON.stringify(validProducts, null, 2), 'utf8');

console.log(`\n✅ Conversión completada!`);
console.log(`📄 Archivo guardado en: ${jsonPath}`);
console.log(`📦 Total productos: ${validProducts.length}`);
console.log(`📦 Con EAN: ${productsWithEan.length}`);