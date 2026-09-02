const admin = require('firebase-admin');
const algoliasearch = require('algoliasearch');

// Inicialización de Firestore y Algolia
const db = admin.firestore();
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || 'O7ZBSD9W9B';
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY || '99b3eb4996d701b26bcfc16c727dc73f'; 
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
const index = client.initIndex('productos_v2');

// ==========================================
// 1. FUNCIÓN DE LIMPIEZA DE PRECIOS
// ==========================================
function parsearPrecio(val) {
  if (typeof val === 'number') return val;
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
  return isNaN(num) ? 0 : num;
}

// ==========================================
// 2. PRECIOS CLAROS (Soporta EAN o Texto)
// ==========================================
async function consultarPreciosEnPreciosClaros(query) {
  try {
    const url = `https://www.preciosclaros.gob.ar/api/productos/buscar?keyword=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(4000)
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    
    if (data && data.productos && data.productos.length > 0) {
      const productoOficial = data.productos[0];
      const preciosPorSuper = {};
      let mejorPrecio = Infinity;

      if (productoOficial.precios && Array.isArray(productoOficial.precios)) {
        productoOficial.precios.forEach(item => {
          const superNombre = item.comercioRazonSocial || item.sucursalNombre || 'Supermercado';
          const precioSucursal = parsearPrecio(item.precio);
          
          if (precioSucursal > 0) {
            preciosPorSuper[superNombre] = precioSucursal;
            if (precioSucursal < mejorPrecio) {
              mejorPrecio = precioSucursal;
            }
          }
        });
      }

      if (Object.keys(preciosPorSuper).length > 0) {
        return {
          name: productoOficial.nombre || productoOficial.descripcion,
          marca: productoOficial.marca || 'GENERICO',
          medida: productoOficial.presentacion || 'UNI',
          imagen: productoOficial.imagen || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
          preciosPorSupermercado: preciosPorSuper,
          precio: mejorPrecio,
          supermercadoMasBarato: Object.keys(preciosPorSuper).reduce((a, b) => preciosPorSuper[a] < preciosPorSuper[b] ? a : b)
        };
      }
    }
  } catch (error) {
    // Falla controlada de Precios Claros, el motor continuará con las APIs directas
  }
  return null;
}

// ==========================================
// 3. APIS DIRECTAS DE SUPERMERCADOS (VTEX y Coto)
// ==========================================
async function consultarVtexChain(domain, chainName, query, isEan = true) {
  try {
    const url = isEan 
      ? `https://www.${domain}/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${query}`
      : `https://www.${domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(4000)
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const prodValido = data[0];
      const item = prodValido.items && prodValido.items[0];
      
      if (item && item.sellers && item.sellers[0]) {
        const offer = item.sellers[0].commertialOffer;
        
        const rawPrices = [
          offer.SpotPrice,
          offer.Price,
          offer.ListPrice
        ].map(p => parsearPrecio(p)).filter(p => p > 0);

        let precio = rawPrices.length > 0 ? Math.min(...rawPrices) : 0;

        if (precio > 10000000) { 
          precio = precio / 100; 
        }

        if (precio > 0 && offer.IsAvailable) {
          return {
            chain: chainName,
            precio,
            name: prodValido.productName,
            imagen: item.images && item.images[0] ? item.images[0].imageUrl : null
          };
        }
      }
    }
  } catch (error) {
    // Silencioso para permitir cascada fluida por cadena
  }
  return null;
}

async function consultarCotoDirecto(query, isEan = true) {
  try {
    const url = `https://www.cotodigital3.com.ar/sitios/cdn/browsing/search?Ntt=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.contents && data.contents[0] && data.contents[0].records && data.contents[0].records.length > 0) {
      const record = data.contents[0].records[0];
      
      let rawPrecio = record.attributes['sku.precio'] || record.attributes['sku.precioRegular'] || 0;
      let precio = parsearPrecio(rawPrecio);
      if (precio > 10000000) precio = precio / 100;
      
      if (precio > 0) {
        return {
          chain: 'Coto',
          precio,
          name: record.attributes['sku.displayName'] || 'Producto Coto',
          imagen: record.attributes['sku.imageURL'] || null
        };
      }
    }
  } catch (e) {}
  return null;
}

// Maxiconsumo u otros mayoristas si operan bajo otra plataforma se pueden acoplar aquí
async function consultarMaxiconsumoDirecto(query, isEan = true) { 
  return null; 
}

async function consultarAPIsDirectasSupermercados(query, isEan = true) {
  try {
    const resultados = await Promise.all([
      consultarVtexChain('carrefour.com.ar', 'Carrefour', query, isEan),
      consultarVtexChain('jumbo.com.ar', 'Jumbo', query, isEan),
      consultarVtexChain('vea.com.ar', 'Vea', query, isEan),
      consultarVtexChain('masonline.com.ar', 'Changomas', query, isEan),
      consultarVtexChain('diaonline.supermercadosdia.com.ar', 'Dia', query, isEan),
      consultarVtexChain('laanonimaonline.com', 'La Anónima', query, isEan), // 👈 ¡Integrado por VTEX!
      consultarCotoDirecto(query, isEan),
      consultarMaxiconsumoDirecto(query, isEan)
    ]);

    const preciosPorSuper = {};
    let mejorPrecio = Infinity;
    let nombreFinal = '';
    let imagenFinal = '';

    resultados.forEach(res => {
      if (res && res.precio > 0) {
        preciosPorSuper[res.chain] = res.precio;
        if (res.precio < mejorPrecio) {
          mejorPrecio = res.precio;
          if (res.name) nombreFinal = res.name;
          if (res.imagen) imagenFinal = res.imagen;
        }
      }
    });

    if (Object.keys(preciosPorSuper).length > 0) {
      return {
        name: nombreFinal || 'Producto en Línea',
        marca: 'DETECTADO EN WEB',
        medida: 'UNI',
        imagen: imagenFinal || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
        preciosPorSupermercado: preciosPorSuper,
        precio: mejorPrecio,
        supermercadoMasBarato: Object.keys(preciosPorSuper).reduce((a, b) => preciosPorSuper[a] < preciosPorSuper[b] ? a : b)
      };
    }
  } catch (error) {}
  return null;
}

async function guardarEnBasePrincipalYAlgolia(ean, datosProducto) {
  const productoData = {
    ean: ean,
    name: datosProducto.name,
    marca: datosProducto.marca || 'GENERICO',
    medida: datosProducto.medida || 'UNI',
    imagen: datosProducto.imagen,
    precio: datosProducto.precio,
    supermercadoMasBarato: datosProducto.supermercadoMasBarato,
    preciosPorSupermercado: datosProducto.preciosPorSupermercado,
    ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('productos').doc(String(ean)).set(productoData, { merge: true });
  try {
    await index.saveObject({ objectID: String(ean), ...productoData });
  } catch (e) {}
}

// ==========================================
// 4. MOTOR PRINCIPAL EN CASCADA
// ==========================================
async function buscarProductoExhaustivo(ean, nombreSugerido = '', marcaSugerida = '', medidaSugerida = '') {
  const cleanEan = String(ean).trim();
  
  // 1. Intento principal por EAN en Supermercados Directos
  let datosDirectos = await consultarAPIsDirectasSupermercados(cleanEan, true);
  if (datosDirectos) {
    await guardarEnBasePrincipalYAlgolia(cleanEan, datosDirectos);
    return { encontrado: true, fuente: 'supermercados_directo_ean', data: datosDirectos };
  }

  // 2. Intento principal por EAN en Precios Claros
  let datosPreciosClaros = await consultarPreciosEnPreciosClaros(cleanEan);
  if (datosPreciosClaros) {
    await guardarEnBasePrincipalYAlgolia(cleanEan, datosPreciosClaros);
    return { encontrado: true, fuente: 'precios_claros_ean', data: datosPreciosClaros };
  }

  // 3. FALLBACK: Construir texto de búsqueda estructurado (Marca + Nombre/Tipo + Medida)
  const queryTextoRico = [marcaSugerida, nombreSugerido, medidaSugerida]
    .filter(val => val && String(val).trim() !== '' && String(val).toUpperCase() !== 'GENERICO' && String(val).toUpperCase() !== 'UNI')
    .join(' ')
    .trim();

  if (queryTextoRico.length > 2) {
    datosDirectos = await consultarAPIsDirectasSupermercados(queryTextoRico, false);
    if (datosDirectos) {
      await guardarEnBasePrincipalYAlgolia(cleanEan, datosDirectos);
      return { encontrado: true, fuente: 'supermercados_directo_texto_rico', data: datosDirectos };
    }

    datosPreciosClaros = await consultarPreciosEnPreciosClaros(queryTextoRico);
    if (datosPreciosClaros) {
      await guardarEnBasePrincipalYAlgolia(cleanEan, datosPreciosClaros);
      return { encontrado: true, fuente: 'precios_claros_texto_rico', data: datosPreciosClaros };
    }
  }

  // 4. Fallback local de Firestore
  const docRef = db.collection('productos').doc(cleanEan);
  const docSnap = await docRef.get();
  
  if (docSnap.exists) {
    const data = docSnap.data();
    if (data && data.precio && data.precio > 0) {
      return { encontrado: true, fuente: 'local_firestore_fallback', data };
    }
  }

  // 5. Registro de pendientes si no hay coincidencias en ninguna fuente oficial
  await db.collection('productos_pendientes').doc(cleanEan).set({
    ean: cleanEan,
    name: nombreSugerido || 'Producto pendiente de rastreo',
    marca: marcaSugerida || '',
    medida: medidaSugerida || '',
    intentos: admin.firestore.FieldValue.increment(1),
    ultimaBusqueda: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return {
    encontrado: false,
    mensaje: "El producto está siendo rastreado en las plataformas oficiales."
  };
}

module.exports = { buscarProductoExhaustivo, consultarPreciosEnPreciosClaros };