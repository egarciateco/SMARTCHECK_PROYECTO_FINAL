const tf = require('@tensorflow/tfjs');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const algoliasearch = require('algoliasearch');

// Importar la función de sincronización automática y enriquecimiento de imágenes
const { sincronizarCatalogoCompleto } = require('./sincronizar');
// Importar el motor en cascada (buscadorService.js)
const { buscarProductoExhaustivo } = require('./buscadorService');

const app = express();
app.use(cors());
app.use(express.json());

// --- SERVIR CARPETA DE LOGOS (Robusto con path.join y respaldo absoluto) ---
app.use('/logos', express.static(path.join(__dirname, 'assets/logos')));
app.use('/logos', express.static('C:/SMARTCHECK/smartcheck-nuevo/assets/logos'));

// --- CACHÉ EN MEMORIA PARA SUCURSALES ---
let sucursalesCache = [];

const cargarSucursales = () => {
  const csvPath = path.join(__dirname, 'sucursales.csv');
  if (!fs.existsSync(csvPath)) {
    console.error("❌ Error: No se encontró el archivo sucursales.csv");
    return;
  }

  const results = [];
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      // LIMPIEZA PROFUNDA: Elimina caracteres invisibles (BOM) de las claves del CSV
      const cleanRow = {};
      Object.keys(row).forEach((key) => {
        const cleanKey = key.replace(/^\uFEFF/, '').trim();
        cleanRow[cleanKey] = row[key];
      });
      results.push(cleanRow);
    })
    .on('end', () => {
      sucursalesCache = results;
      console.log(`✅ ${sucursalesCache.length} sucursales cargadas. Columnas detectadas:`, Object.keys(results[0] || {}));
    })
    .on('error', (err) => console.error("Error leyendo CSV:", err));
};

cargarSucursales();

// Middleware de Monitoreo
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    console.log(`🌐 [HTTP] ${req.method} ${req.originalUrl} --> Status: ${res.statusCode} (${duracion}ms)`);
  });
  next();
});

// Inicialización Firebase
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
    : require('./serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Inicialización Algolia
const algoliaClient = algoliasearch(
    process.env.ALGOLIA_APP_ID || 'O7ZBSD9W9B', 
    process.env.ALGOLIA_API_KEY || '2f9dc7d608e360c5645aff358163b877'
);
const productsIndex = algoliaClient.initIndex('productos_v2');

// --- LÓGICA AUXILIAR Y FILTRO ANTI-BULTOS ---
const parseCoord = (val) => {
  if (val === undefined || val === null) return 0;
  const cleanVal = String(val).replace(',', '.').trim();
  const parsed = parseFloat(cleanVal);
  return isNaN(parsed) ? 0 : parsed;
};

const buscarCampo = (obj, posiblesNombres) => {
  const llaves = Object.keys(obj);
  for (const nombre of posiblesNombres) {
    const encontrada = llaves.find(k => k.toLowerCase() === nombre.toLowerCase());
    if (encontrada !== undefined && obj[encontrada] !== undefined && obj[encontrada] !== '') {
      return obj[encontrada];
    }
  }
  return null;
};

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Función para limpiar precios inflados/bultos en resultados masivos de Algolia
const limpiarProductoAlgolia = (hit) => {
  let precio = Number(hit.precio || hit.price || 0);
  const nombre = String(hit.nombre || hit.title || '').toLowerCase();
  
  // Si detecta palabras de bulto o pack mayorista en el título y el precio es muy alto
  const esBulto = nombre.includes('bulto') || nombre.includes('pack x') || nombre.includes('caja x');
  
  if (esBulto && precio > 15000) {
    // Intenta estimar un precio unitario más lógico o acotarlo
    precio = Math.round(precio / 6); 
  } else if (precio > 18000 && !nombre.includes('carne') && !nombre.includes('cortes') && !nombre.includes('aceite 5')) {
    // Techo general para evitar mostrar precios absurdos de más de $18.000 en góndola común
    precio = 2499; 
  }

  return {
    ...hit,
    id: hit.objectID || hit.id,
    precio: precio > 0 ? precio : 1499
  };
};

// --- RUTA: SUPERMERCADOS CERCANOS ---
app.get('/api/supermercados/cercanos', (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ status: 'error', message: 'Coordenadas faltantes' });
  }

  const userLat = parseCoord(lat);
  const userLng = parseCoord(lng);

  if (sucursalesCache.length === 0) {
    return res.status(500).json({ status: 'error', message: 'No hay sucursales cargadas' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const obtenerNombreLogo = (nombre) => {
    if (!nombre) return 'default.png';
    const n = String(nombre).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    if (n.includes('maxiconsumo')) return 'maxiconsumo.png';
    if (n.includes('changomas') || n.includes('chango')) return 'changomas.png';
    if (n.includes('mas online') || n.includes('masonline')) return 'mas_online.png';
    if (n.includes('carrefour')) return 'carrefour.png';
    if (n.includes('coto')) return 'coto.png';
    if (n.includes('vea')) return 'vea.png';
    if (n.includes('dia')) return 'dia.png';
    if (n.includes('disco')) return 'disco.png';
    if (n.includes('jumbo')) return 'jumbo.png';
    if (n.includes('walmart')) return 'walmart.png';
    if (n.includes('anonima')) return 'lanonima.png';
    
    return 'default.png';
  };

  const conDistancia = sucursalesCache.map(suc => {
    const rawLat = buscarCampo(suc, ['latitude', 'latitud', 'lat', 'LATITUD', 'LAT', 'y']);
    const rawLng = buscarCampo(suc, ['longitude', 'longitud', 'lng', 'lon', 'LONGITUD', 'LON', 'x']);
    const sucLat = parseCoord(rawLat);
    const sucLng = parseCoord(rawLng);
    const distanciaKm = calcularDistancia(userLat, userLng, sucLat, sucLng);

    const nombreSupermercado = suc.supermercado || 'Supermercado';
    const nombreLogoArchivo = obtenerNombreLogo(nombreSupermercado);

    return {
      ...suc,
      logo: `${baseUrl}/logos/${nombreLogoArchivo}`,
      distanciaKm: parseFloat(distanciaKm.toFixed(2)),
      distancia: distanciaKm < 1 ? `${Math.round(distanciaKm * 1000)} mts` : `${distanciaKm.toFixed(1)} km`
    };
  });

  conDistancia.sort((a, b) => a.distanciaKm - b.distanciaKm);
  res.json({ status: 'success', data: conDistancia.slice(0, 15) });
});

// --- RESTO DE RUTAS ---
app.post('/api/admin/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    const doc = await db.collection('config').doc('admin_settings').get();
    const storedPassword = doc.exists && doc.data().password ? String(doc.data().password) : "00192";
    if (String(password) === storedPassword) return res.json({ status: "éxito", access: true });
    return res.status(401).json({ status: "error", mensaje: "Contraseña incorrecta" });
  } catch (error) { return res.status(500).json({ status: "error", mensaje: error.message }); }
});

app.post('/api/admin/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const doc = await db.collection('config').doc('admin_settings').get();
    const storedPassword = doc.exists && doc.data().password ? String(doc.data().password) : "00192";
    if (String(currentPassword) !== storedPassword) return res.status(400).json({ status: "error", mensaje: "Contraseña incorrecta" });
    await db.collection('config').doc('admin_settings').set({ password: String(newPassword) }, { merge: true });
    return res.json({ status: "éxito", mensaje: "Contraseña actualizada" });
  } catch (error) { return res.status(500).json({ status: "error", mensaje: error.message }); }
});

// --- RUTA ACTUALIZADA CON MOTOR EN CASCADA (WATERFALL) ---
app.get('/api/producto/:ean', async (req, res) => {
  try {
    const { ean } = req.params;
    const nombreSugerido = req.query.nombre || '';
    
    const resultado = await buscarProductoExhaustivo(ean, nombreSugerido);

    if (!resultado.encontrado) {
      return res.status(200).json({
        status: 'pendiente',
        encontrado: false,
        mensaje: resultado.mensaje
      });
    }

    res.json({ 
      status: 'éxito', 
      fuente: resultado.fuente,
      producto: resultado.data 
    });
  } catch (error) { 
    res.status(500).json({ status: 'error', mensaje: error.message }); 
  }
});

app.get('/api/productos/autocompletar', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ status: 'success', data: [] });
    const algoliaRes = await productsIndex.search(q, { hitsPerPage: 10 });
    const productosLimpios = algoliaRes.hits.map(hit => limpiarProductoAlgolia(hit));
    res.json({ status: 'success', data: productosLimpios });
  } catch (error) { res.status(500).json({ status: 'error', mensaje: error.message }); }
});

app.get('/api/productos/buscar', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.status(400).json({ status: 'error', mensaje: 'Término faltante' });
    const algoliaRes = await productsIndex.search(q, { hitsPerPage: 50 });
    const productosLimpios = algoliaRes.hits.map(hit => limpiarProductoAlgolia(hit));
    res.json({ status: 'success', data: productosLimpios });
  } catch (error) { res.status(500).json({ status: 'error', mensaje: error.message }); }
});

app.post('/api/users/historial-compras', async (req, res) => {
  try {
    const { uid, fecha, total, itemsCount, items } = req.body;
    if (!uid) return res.status(400).json({ status: 'error', mensaje: 'UID requerido' });
    const nuevaCompraRef = db.collection('users').doc(uid).collection('historial_compras').doc();
    await nuevaCompraRef.set({ id: nuevaCompraRef.id, fecha: fecha || new Date().toISOString(), total: total || 0, itemsCount: itemsCount || 0, items: items || [], createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.json({ status: 'success', mensaje: 'Guardado', id: nuevaCompraRef.id });
  } catch (error) { return res.status(500).json({ status: 'error', mensaje: error.message }); }
});

app.get('/api/users/historial-compras/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.json({ status: 'success', data: [] });
    }

    const userData = userDoc.data();
    const historial = userData.historialCompras || userData.historial_compras || [];

    return res.json({ status: 'success', data: historial });
  } catch (error) { 
    return res.status(500).json({ status: 'error', mensaje: error.message }); 
  }
});

app.get('/api/users/usuario/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ status: 'error', mensaje: 'Usuario no encontrado' });
    }

    return res.json({ status: 'success', data: userDoc.data() });
  } catch (error) { 
    return res.status(500).json({ status: 'error', mensaje: error.message }); 
  }
});

app.get('/api/sincronizar', async (req, res) => {
  try {
    console.log("⏰ [CRON] Solicitud recibida: Iniciando sincronización y enriquecimiento de imágenes...");
    await sincronizarCatalogoCompleto();
    return res.status(200).json({ 
      status: 'success', 
      message: 'Catálogo sincronizado y enriquecido correctamente en Firestore y Algolia.' 
    });
  } catch (error) {
    console.error("❌ [CRON] Error crítico durante la sincronización automática:", error);
    return res.status(500).json({ 
      status: 'error', 
      mensaje: error.message 
    });
  }
});

try {
  const userRoutes = require('./routes/users'); 
  app.use('/api/users', userRoutes);
} catch (e) { console.log("Rutas de usuarios externas omitidas."); }

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor activo en puerto ${PORT}`);
});