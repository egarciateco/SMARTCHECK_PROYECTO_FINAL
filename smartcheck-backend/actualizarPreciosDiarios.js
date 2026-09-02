const admin = require('firebase-admin');
const cron = require('node-cron');
const { consultarPreciosEnPreciosClaros } = require('./buscadorService');

// ==========================================
// 0. INICIALIZACIÓN
// ==========================================
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ==========================================
// 1. FUNCIÓN DE PARSEO DE PRECIOS (SIN LÍMITES ARTIFICIALES)
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

// ==========================================
// 2. BUSCADOR MULTIFUENTE
// ==========================================
async function obtenerPreciosConEstrategiaMultifuente(ean, nombreProducto) {
  let datosFinales = null;
  try {
    datosFinales = await consultarPreciosEnPreciosClaros(ean);
  } catch (error) {
    console.log(`⚠️ Falló la fuente principal para EAN ${ean}: ${error.message}`);
  }
  return datosFinales;
}

// ==========================================
// 3. PROCESAR PRODUCTOS PENDIENTES
// ==========================================
async function procesarProductosPendientes() {
  console.log("🔄 [CRON] Verificando cola de productos pendientes...");
  try {
    const pendientesSnapshot = await db.collection('productos_pendientes').get();
    if (pendientesSnapshot.empty) {
      console.log("✨ No hay productos pendientes en la cola.");
      return;
    }

    for (const docPendiente of pendientesSnapshot.docs) {
      const { ean, name } = docPendiente.data();
      const datosNuevos = await obtenerPreciosConEstrategiaMultifuente(ean, name);

      if (datosNuevos && datosNuevos.preciosPorSupermercado && Object.keys(datosNuevos.preciosPorSupermercado).length > 0) {
        let preciosLimpios = {};
        let mejorPrecio = Infinity;
        let supermercadoMasBarato = 'N/A';

        Object.entries(datosNuevos.preciosPorSupermercado).forEach(([superName, val]) => {
          let rawVal = (val && typeof val === 'object') ? (val.precio || val.valor || 0) : val;
          const precioNum = parsearPrecio(rawVal);
          if (precioNum > 0) {
            preciosLimpios[superName] = precioNum;
            if (precioNum < mejorPrecio) {
              mejorPrecio = precioNum;
              supermercadoMasBarato = superName;
            }
          }
        });

        await db.collection('productos').doc(ean).set({
          ean: ean,
          name: datosNuevos.name || name,
          marca: datosNuevos.marca || 'GENERICO',
          medida: datosNuevos.medida || 'UNI',
          imagen: datosNuevos.imagen || '',
          precio: mejorPrecio !== Infinity ? mejorPrecio : 0,
          supermercadoMasBarato: supermercadoMasBarato !== 'N/A' ? supermercadoMasBarato : 'N/A',
          preciosPorSupermercado: preciosLimpios,
          ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await docPendiente.ref.delete();
        console.log(`✅ [PENDIENTE RESUELTO] EAN ${ean} promovido a la base principal.`);
      }
    }
  } catch (error) {
    console.error("❌ Error al procesar productos pendientes:", error.message);
  }
}

// ==========================================
// 4. PROCESO CENTRAL DE ACTUALIZACIÓN DIARIA
// ==========================================
async function sincronizarPreciosSupermercados() {
  console.log("==================================================");
  console.log("⏰ INICIANDO ACTUALIZACIÓN NOCTURNA DE PRECIOS");
  console.log("==================================================\n");

  try {
    await procesarProductosPendientes();

    const productosRef = db.collection('productos');
    const snapshot = await productosRef.get();

    if (snapshot.empty) {
      console.log("No hay productos registrados en Firestore para actualizar.");
      return;
    }

    let batch = db.batch();
    let batchCount = 0;
    let actualizados = 0;

    for (const doc of snapshot.docs) {
      const producto = doc.data();
      const ean = producto.ean || doc.id;
      const nombreProd = producto.name || '';
      
      const datosNuevos = await obtenerPreciosConEstrategiaMultifuente(ean, nombreProd);

      if (datosNuevos && datosNuevos.preciosPorSupermercado && Object.keys(datosNuevos.preciosPorSupermercado).length > 0) {
        let preciosLimpios = {};
        let mejorPrecio = Infinity;
        let supermercadoMasBarato = 'N/A';

        Object.entries(datosNuevos.preciosPorSupermercado).forEach(([superName, val]) => {
          let rawVal = (val && typeof val === 'object') ? (val.precio || val.valor || 0) : val;
          const precioNum = parsearPrecio(rawVal);
          if (precioNum > 0) {
            preciosLimpios[superName] = precioNum;
            if (precioNum < mejorPrecio) {
              mejorPrecio = precioNum;
              supermercadoMasBarato = superName;
            }
          }
        });

        batch.update(doc.ref, {
          preciosPorSupermercado: preciosLimpios,
          precio: mejorPrecio !== Infinity ? mejorPrecio : (producto.precio || 0),
          supermercadoMasBarato: mejorPrecio !== Infinity ? supermercadoMasBarato : (producto.supermercadoMasBarato || 'N/A'),
          ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        });

        batchCount++;
        actualizados++;
      }

      if (batchCount >= 400) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`\n✅ Sincronización nocturna finalizada. Total actualizados: ${actualizados}`);

  } catch (error) {
    console.error("❌ Error crítico en actualización diaria:", error.message);
  }
}

// ==========================================
// 5. CRON (03:00 AM)
// ==========================================
cron.schedule('0 3 * * *', () => {
  sincronizarPreciosSupermercados();
});

if (require.main === module) {
  sincronizarPreciosSupermercados().then(() => {
    console.log("Proceso manual finalizado. Cerrando...");
    process.exit(0);
  });
}

module.exports = { sincronizarPreciosSupermercados };