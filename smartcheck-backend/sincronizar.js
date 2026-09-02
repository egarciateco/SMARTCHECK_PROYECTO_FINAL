const admin = require('firebase-admin');
const algoliasearch = require('algoliasearch');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const cron = require('node-cron');
const { CATEGORIAS_SUPER } = require('./categoriasConfig');

// ==========================================
// 🛡️ PROTECCIÓN CRÍTICA PARA EJECUCIÓN NOCTURNA
// ==========================================
process.on('uncaughtException', (error) => {
  console.error('🔥 [CRITICAL] Excepción no capturada:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 [CRITICAL] Promesa rechazada no manejada:', reason);
});

// ==========================================
// 0. INICIALIZACIÓN DE FIREBASE, ALGOLIA Y MARCAS
// ==========================================
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const { buscarProductoExhaustivo } = require('./buscadorService');

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || 'O7ZBSD9W9B';
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY || '99b3eb4996d701b26bcfc16c727dc73f'; 
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
const index = client.initIndex('productos_v2');

// 📂 Cargar el diccionario de marcas y logos generado por Python
let marcasLogos = {};
try {
  const marcasPath = path.join(__dirname, 'marcas_logos.json');
  if (fs.existsSync(marcasPath)) {
    const rawData = fs.readFileSync(marcasPath, 'utf-8');
    marcasLogos = JSON.parse(rawData);
    console.log(`✅ [Marcas] Diccionario cargado con éxito: ${Object.keys(marcasLogos).length} marcas disponibles.`);
  } else {
    console.warn(`⚠️ [Marcas] No se encontró 'marcas_logos.json'. Los productos se guardarán sin logo de marca.`);
  }
} catch (error) {
  console.error(`❌ [Marcas] Error al cargar el JSON de marcas:`, error.message);
}

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// 1. FUNCIONES DE PARSEO, TAXONOMÍA E ICONOS
// ==========================================
function parsearPrecio(val) {
  if (typeof val === 'number') {
    return val > 0 ? Math.round(val * 100) / 100 : 0;
  }
  if (!val) return 0;
  const clean = String(val).replace(/[^0-9,.-]+/g, "").trim();
  if (!clean) return 0;

  let normalized = clean;
  if (clean.includes(',') && clean.includes('.')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      normalized = clean.replace(/\./g, "").replace(',', '.');
    } else {
      normalized = clean.replace(/,/g, "");
    }
  } else if (clean.includes(',')) {
    normalized = clean.replace(',', '.');
  }

  const num = parseFloat(normalized);
  if (isNaN(num) || num <= 0) return 0;

  return Math.round(num * 100) / 100;
}

function clasificarJerarquiaTaxonomica(nombreProd, rubroOriginal) {
  const n = (nombreProd || "").toLowerCase();
  const r = (rubroOriginal || "").toLowerCase();
  const match = (words) => words.some(w => n.includes(w) || r.includes(w));

  // --- BEBIDAS SIN ALCOHOL ---
  if (match(['gaseosa', 'coca', 'pepsi', 'sprite', '7up', 'fanta', 'schweppes'])) {
    return { categoria: 'Bebidas sin Alcohol', subcategoria: 'Gaseosas' };
  }
  if (match(['agua mineral', 'agua saborizada', 'soda', 'villavicencio', 'eco de los andes', 'glaciar'])) {
    return { categoria: 'Bebidas sin Alcohol', subcategoria: 'Aguas y Sodas' };
  }
  if (match(['jugo', 'isotonica', 'gatorade', 'powerade', 'energizante', 'red bull', 'monster', 'tang', 'clight', 'baggio', 'cepita'])) {
    return { categoria: 'Bebidas sin Alcohol', subcategoria: 'Jugos y Bebidas Isotónicas' };
  }

  // --- BEBIDAS CON ALCOHOL ---
  if (match(['cerveza', 'quilmes', 'heineken', 'corona', 'stella', 'amstel', 'brahma', 'imperial'])) {
    return { categoria: 'Bebidas con Alcohol', subcategoria: 'Cervezas' };
  }
  if (match(['vino', 'malbec', 'cabernet', 'chardonnay', 'torrontes', 'syrah', 'frizze'])) {
    return { categoria: 'Bebidas con Alcohol', subcategoria: 'Vinos y Espumantes' };
  }
  if (match(['fernet', 'vodka', 'gin', 'whisky', 'aperitivos', 'gancia', 'campari', 'branca', 'smirnoff'])) {
    return { categoria: 'Bebidas con Alcohol', subcategoria: 'Aperitivos y Espirituosas' };
  }

  // --- LÁCTEOS ---
  if (match(['leche', 'crema de leche'])) {
    return { categoria: 'Lacteos', subcategoria: 'Leches y Cremas' };
  }
  if (match(['yogur', 'postre lacteo', 'serenito', 'alpin'])) {
    return { categoria: 'Lacteos', subcategoria: 'Yogures y Postres' };
  }
  if (match(['queso', 'sardo', 'reggianito', 'tybo', 'cremoso', 'port salut', 'mozzarella'])) {
    return { categoria: 'Lacteos', subcategoria: 'Quesos' };
  }
  if (match(['manteca', 'margarina'])) {
    return { categoria: 'Lacteos', subcategoria: 'Mantecas y Margarinas' };
  }

  // --- ALIMENTOS CONGELADOS ---
  if (match(['hamburguesa', 'medallon', 'nuggets', 'papas fritas congeladas', 'pizza congelada', 'empanadas congeladas'])) {
    return { categoria: 'Congelados', subcategoria: 'Comidas y Preparados Congelados' };
  }

  // --- PASTAS Y TAPAS ---
  if (match(['tapa de empanada', 'tapa de pascualina', 'ñoquis', 'ravioles', 'fideos frescos', 'tallarines frescos'])) {
    return { categoria: 'Panaderia y Pasteleria', subcategoria: 'Tapas de Empanadas y Pascualina' };
  }

  // --- FRUTAS Y VERDURAS ---
  if (match(['banana', 'manzana', 'pera', 'naranja', 'frutilla', 'limon', 'kiwi', 'durazno', 'mandarina'])) {
    return { categoria: 'Frutas y Verduras', subcategoria: 'Frutas Frescas' };
  }
  if (match(['tomate', 'lechuga', 'cebolla', 'papa', 'zanahoria', 'zapallo', 'morron', 'acelga', 'espinaca', 'ajo'])) {
    return { categoria: 'Frutas y Verduras', subcategoria: 'Verduras y Hortalizas' };
  }

  // --- ALMACÉN ---
  if (match(['dulce de leche', 'mermelada', 'cafe', 'te', 'mate cocido', 'cacao', 'nesquik', 'galletitas', 'tostadas', 'bizcochos', 'magdalenas'])) {
    return { categoria: 'Almacen', subcategoria: 'Desayuno y Merienda' };
  }
  if (match(['aceite', 'vinagre', 'mayonesa', 'ketchup', 'mostaza', 'salsa golf', 'aderezo'])) {
    return { categoria: 'Almacen', subcategoria: 'Aceites, Vinagres y Aderezos' };
  }
  if (match(['fideo', 'arroz', 'harina', 'polenta', 'pan rallado', 'fecula', 'tallarin seco'])) {
    return { categoria: 'Almacen', subcategoria: 'Harinas, Fideos y Arroz' };
  }
  if (match(['azucar', 'sal fina', 'sal gruesa', 'cacao amargo', 'esencia de vainilla'])) {
    return { categoria: 'Almacen', subcategoria: 'Ingredientes Básicos y Condimentos' };
  }
  if (match(['atun', 'caballa', 'choclo', 'arveja', 'tomate en lata', 'pure de tomate', 'lenteja', 'garbanzo'])) {
    return { categoria: 'Almacen', subcategoria: 'Enlatados y Conservas' };
  }
  if (match(['alfajor', 'chocolate', 'caramelo', 'chupetin', 'bon o bon', 'kinder'])) {
    return { categoria: 'Kiosco', subcategoria: 'Alfajores y Golosinas' };
  }
  if (match(['papas fritas', 'palitos salados', 'mani', 'snacks', 'chizitos'])) {
    return { categoria: 'Almacen', subcategoria: 'Snacks y Galletitas Saladas' };
  }

  // --- LIMPIEZA ---
  if (match(['lavandina', 'detergente', 'limpiador', 'jabon en polvo', 'suavizante', 'esponja', 'desinfectante'])) {
    return { categoria: 'Limpieza', subcategoria: 'Limpieza del Hogar' };
  }

  // --- PERFUMERÍA Y CUIDADO PERSONAL ---
  if (match(['shampoo', 'acondicionador', 'crema de enjuague', 'tintura'])) {
    return { categoria: 'Perfumeria y Cuidado Personal', subcategoria: 'Cuidado Capilar (Shampoo y Acondicionador)' };
  }
  if (match(['jabon de tocador', 'desodorante', 'pasta dental', 'cepillo de dientes', 'enjuague bucal', 'maquinita', 'afeitar'])) {
    return { categoria: 'Perfumeria y Cuidado Personal', subcategoria: 'Jabones y Desodorantes' };
  }

  // --- PAPELES ---
  if (match(['papel higienico', 'rollo de cocina', 'servilleta', 'pañuelo descartable'])) {
    return { categoria: 'Limpieza', subcategoria: 'Papeles, Servilletas y Bolsas' };
  }

  // --- BEBÉS ---
  if (match(['pañal', 'toallitas humedas', 'mamadera', 'chupete', 'infantil'])) {
    return { categoria: 'Bebes y Ninos', subcategoria: 'Pañales y Toallitas Húmedas' };
  }

  // --- MASCOTAS ---
  if (match(['perro', 'gato', 'alimento balanceado', 'pedigree', 'whiskas', 'dog chow', 'cat chow'])) {
    return { categoria: 'Mascotas', subcategoria: 'Alimento para Perros' };
  }

  return { categoria: 'Almacen', subcategoria: 'Desayuno y Merienda' };
}

// Función auxiliar robusta para obtener el icono PNG y color sin fallar por acentos
function obtenerConfigCategoria(categoriaNombre) {
  if (!categoriaNombre) return { iconoPng: null, colorFondo: '#F5F5F5' };
  if (CATEGORIAS_SUPER[categoriaNombre]) return CATEGORIAS_SUPER[categoriaNombre];
  
  const sinTildes = categoriaNombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const key of Object.keys(CATEGORIAS_SUPER)) {
    const keySinTildes = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (keySinTildes.toLowerCase() === sinTildes.toLowerCase()) {
      return CATEGORIAS_SUPER[key];
    }
  }
  return CATEGORIAS_SUPER["Almacen"] || { iconoPng: null, colorFondo: '#F5F5F5' };
}

function parseCSVLine(text) {
  const result = [];
  let entry = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(entry.trim());
      entry = '';
    } else {
      entry += c;
    }
  }
  result.push(entry.trim());
  return result.map(s => s.replace(/^"|"$/g, ''));
}

// ==========================================
// 2. IMPORTACIÓN DE CSV A FIRESTORE (Con Iconos y Marcas)
// ==========================================
async function importarCsvAFirestore() {
  const csvPath = path.join(__dirname, 'productos.csv');
  if (!fs.existsSync(csvPath)) {
    console.log("⚠️ No se encontró productos.csv. Se omite la importación.");
    return;
  }

  console.log("📂 Leyendo productos.csv aplicando taxonomía, marcas y diseño de iconos...");
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let esHeader = true;
  let batch = db.batch();
  let batchCount = 0;
  let countImportados = 0;

  for await (const line of rl) {
    if (esHeader) {
      esHeader = false;
      continue; 
    }
    if (!line.trim()) continue;

    const cols = parseCSVLine(line);
    if (cols.length >= 6) {
      const [ean, nombre, marca, medida, rubro, precio, precioNumerico] = cols;

      if (ean && ean.trim()) {
        const eanClean = ean.trim();
        const docRef = db.collection('productos').doc(eanClean);
        const precioNum = parsearPrecio(precioNumerico || precio || 0);
        
        const { categoria, subcategoria } = clasificarJerarquiaTaxonomica(nombre, rubro);
        const configCat = obtenerConfigCategoria(categoria);

        const nombreMarcaOriginal = marca ? marca.trim() : 'GENERICO';
        const infoMarca = marcasLogos[nombreMarcaOriginal] || {
          nombreOriginal: nombreMarcaOriginal,
          slug: '',
          logoUrl: null,
          dominioEstimado: null
        };

        batch.set(docRef, {
          ean: eanClean,
          name: nombre ? nombre.trim() : '',
          marca: nombreMarcaOriginal,
          marcaInfo: {
            nombre: nombreMarcaOriginal,
            logoUrl: infoMarca.logoUrl,
            slug: infoMarca.slug
          },
          medida: medida ? medida.trim() : 'UNI',
          categoria: categoria,
          subcategoria: subcategoria,
          // 🖼️ Inyección automática del Icono PNG 3D y color de fondo para la UI
          categoriaIconoUrl: configCat.iconoPng || null,
          colorFondoCategoria: configCat.colorFondo || '#F5F5F5',
          precio: precioNum,
          ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        batchCount++;
        countImportados++;

        if (countImportados % 1000 === 0) {
          console.log(`⏳ [CSV] Procesados e importados: ${countImportados} productos...`);
        }

        if (batchCount >= 400) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }
  console.log(`✅ Catálogo CSV sincronizado con éxito: ${countImportados} productos procesados.`);
}

// ==========================================
// 3. SINCRONIZACIÓN COMPLETA Y BÚSQUEDA EXHAUSTIVA
// ==========================================
async function sincronizarCatalogoCompleto() {
  console.log("==================================================");
  console.log("🚀 INICIANDO SINCRONIZACIÓN NOCTURNA EXHAUSTIVA");
  console.log("==================================================\n");

  const startTime = Date.now();

  try {
    await importarCsvAFirestore();

    console.log("🔄 Verificando y actualizando precios mediante cascada oficial...");
    const snapshot = await db.collection('productos').get();

    if (!snapshot.empty) {
      let actualizadosPrecios = 0;
      const totalDocs = snapshot.docs.length;
      let procesadosPrecios = 0;

      for (const doc of snapshot.docs) {
        procesadosPrecios++;
        const producto = doc.data();
        const eanOriginal = producto.ean || doc.id;
        const eanClean = String(eanOriginal).trim();
        
        // 🛡️ FILTRO BLINDADO: Ignorar códigos internos cortos o que empiezan con 10
        if (eanClean.startsWith('10') || eanClean.length < 8) {
          continue;
        }

        const preciosSuper = producto.preciosPorSupermercado;
        let tienePreciosValidos = false;
        if (preciosSuper && typeof preciosSuper === 'object') {
          tienePreciosValidos = Object.values(preciosSuper).some(p => parsearPrecio(p) > 0);
        }

        if (tienePreciosValidos) {
          if (procesadosPrecios % 500 === 0 || procesadosPrecios === totalDocs) {
            const porcentaje = ((procesadosPrecios / totalDocs) * 100).toFixed(1);
            console.log(`⏳ [Precios] Progreso: [${procesadosPrecios} / ${totalDocs}] (${porcentaje}%) - Actualizados: ${actualizadosPrecios}`);
          }
          continue; 
        }

        try {
          const resultadoBusqueda = await buscarProductoExhaustivo(
            eanClean,
            producto.name || producto.nombre || '',
            producto.marca || '',
            producto.medida || ''
          );

          if (resultadoBusqueda && resultadoBusqueda.encontrado) {
            actualizadosPrecios++;
          }
        } catch (itemError) {
          // El buscador gestiona el registro en pendientes si no hay éxito
        }

        if (procesadosPrecios % 100 === 0 || procesadosPrecios === totalDocs) {
          const porcentaje = ((procesadosPrecios / totalDocs) * 100).toFixed(1);
          console.log(`⏳ [Precios] Progreso: [${procesadosPrecios} / ${totalDocs}] (${porcentaje}%) - Actualizados: ${actualizadosPrecios}`);
        }

        await esperar(400); 
      }

      console.log(`✅ Ciclo de actualización de precios finalizado. Actualizados: ${actualizadosPrecios}`);
    }

    console.log("⚙️ Configurando índices y facetas en Algolia...");
    await index.setSettings({
      searchableAttributes: ['name', 'marca'],
      attributesForFaceting: ['marca', 'supermercadoMasBarato', 'categoria', 'subcategoria']
    });

    console.log("📥 Sincronizando catálogo completo y subiendo registros a Algolia con iconos y colores...");
    const snapshotFinal = await db.collection('productos').get();
    let countIgnorados = 0;
    const totalFinal = snapshotFinal.docs.length;
    let procesadosAlgolia = 0;
    let chunkRecords = [];

    for (const doc of snapshotFinal.docs) {
      procesadosAlgolia++;
      const data = doc.data();
      const ean = doc.id;
      const nombreProducto = data.name || data.nombre || '';

      if (!nombreProducto.trim()) {
        countIgnorados++;
        continue;
      }

      let precioPrincipal = parsearPrecio(data.precio || 0);
      if (precioPrincipal <= 0) {
        countIgnorados++;
        continue;
      }

      const supermercadoBaratoFinal = (data.supermercadoMasBarato && data.supermercadoMasBarato !== 'N/A') 
        ? data.supermercadoMasBarato 
        : 'N/A';

      const imagenFinal = data.imagen || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';
      
      const { categoria, subcategoria } = clasificarJerarquiaTaxonomica(nombreProducto, data.categoria || data.rubro);
      const configCat = obtenerConfigCategoria(categoria);

      const nombreMarca = data.marca || 'GENERICO';
      const infoMarcaAlgolia = marcasLogos[nombreMarca] || data.marcaInfo || {
        nombreOriginal: nombreMarca,
        slug: '',
        logoUrl: null
      };

      chunkRecords.push({
        objectID: ean,
        ean: ean,
        name: nombreProducto.trim(),
        marca: nombreMarca,
        marcaInfo: {
          nombre: nombreMarca,
          logoUrl: infoMarcaAlgolia.logoUrl || null,
          slug: infoMarcaAlgolia.slug || ''
        },
        medida: data.medida || 'UNI',
        image: imagenFinal, 
        categoria: categoria,
        subcategoria: subcategoria,
        // 🧭 Icono PNG y color de fondo indexados para la App
        categoriaIconoUrl: configCat.iconoPng || data.categoriaIconoUrl || null,
        colorFondoCategoria: configCat.colorFondo || data.colorFondoCategoria || '#F5F5F5',
        precio: precioPrincipal,
        supermercadoMasBarato: supermercadoBaratoFinal,
        preciosPorSupermercado: data.preciosPorSupermercado || {}
      });

      if (chunkRecords.length >= 1000 || procesadosAlgolia === totalFinal) {
        await index.saveObjects(chunkRecords, { autoGenerateObjectIDIfNotExist: false });
        console.log(`📤 [Algolia] Lote subido. Progreso: [${procesadosAlgolia} / ${totalFinal}]`);
        chunkRecords = []; 
      }
    }

    const durationMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`==================================================`);
    console.log(`🎉 ¡SINCRONIZACIÓN NOCTURNA EXHAUSTIVA FINALIZADA!`);
    console.log(`⏱️ Tiempo total: ${durationMinutes} minutos.`);
    console.log(`📦 Registros ignorados sin precio/nombre: ${countIgnorados}`);
    console.log(`==================================================`);

  } catch (error) {
    console.error("❌ Error crítico durante la sincronización nocturna:", error);
  }
}

// ==========================================
// 4. PROGRAMADOR CRON (Mediodía - 12:00 PM)
// ==========================================
cron.schedule('0 12 * * *', () => {
  console.log("⏰ [CRON MEDIODÍA] Iniciando sincronización automática...");
  sincronizarCatalogoCompleto();
});

if (require.main === module) {
  sincronizarCatalogoCompleto().then(() => {
    console.log("Proceso nocturno lanzado. ¡Ya puedes dejarlo corriendo y descansar!");
  });
}

module.exports = { sincronizarCatalogoCompleto };