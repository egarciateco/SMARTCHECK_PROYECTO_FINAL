const admin = require('firebase-admin');

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
// 1. FUNCIÓN ROBUSTA DE PARSEO DE PRECIOS
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
// 2. FUNCIÓN DE PURGA Y SANEAMIENTO POR LOTES
// ==========================================
async function limpiarYActualizarFirestore() {
  console.log("🧹 Conectando a Firestore para iniciar la limpieza por lotes...");

  try {
    const snapshot = await db.collection('productos').get();

    if (snapshot.empty) {
      console.log("⚠️ No hay productos en la colección 'productos' de Firestore.");
      return;
    }

    const docs = snapshot.docs;
    console.log(`📦 Se encontraron ${docs.length} documentos. Procesando...`);

    let eliminadosCount = 0;
    let actualizadosCount = 0;

    // Procesar en bloques (chunks) de 400 para respetar el límite de 500 de Firestore Batch
    const chunkSize = 400;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const batch = db.batch();
      let operacionesEnLote = 0;

      for (const doc of chunk) {
        const data = doc.data();
        const ean = doc.id;
        const nombreProducto = data.name || data.nombre || '';

        // REGLA 1: Sin nombre -> Eliminar
        if (!nombreProducto.trim()) {
          batch.delete(doc.ref);
          eliminadosCount++;
          operacionesEnLote++;
          continue;
        }

        // REGLA 2: EAN interno inválido -> Eliminar
        if (ean.startsWith('1022') || ean.startsWith('1023')) {
          batch.delete(doc.ref);
          eliminadosCount++;
          operacionesEnLote++;
          continue;
        }

        // REGLA 3: Sanitizar precios y filtrar bultos mayoristas
        const preciosLimpiosPorSuper = {};
        let minPrecio = Infinity;
        let mejorSuper = 'N/A';

        if (data.preciosPorSupermercado && typeof data.preciosPorSupermercado === 'object') {
          Object.entries(data.preciosPorSupermercado).forEach(([superName, val]) => {
            let rawVal = val;
            if (val && typeof val === 'object') {
              rawVal = val.precio || val.valor || val.price || val.costo || 0;
            }
            const precioNum = parsearPrecio(rawVal);

            const nombreLower = nombreProducto.toLowerCase();
            const esAlmacenComun = nombreLower.includes('aceite') || nombreLower.includes('fideo') || nombreLower.includes('yerba') || nombreLower.includes('galletita');
            
            if (esAlmacenComun && precioNum > 18000) {
              return; // Descarta precio inflado de caja/bulto
            }

            if (precioNum > 0 && precioNum < 2000000) {
              preciosLimpiosPorSuper[superName] = precioNum;
              if (precioNum < minPrecio) {
                minPrecio = precioNum;
                mejorSuper = superName;
              }
            }
          });
        }

        // REGLA 4: Sin precios válidos -> Eliminar
        if (Object.keys(preciosLimpiosPorSuper).length === 0) {
          batch.delete(doc.ref);
          eliminadosCount++;
          operacionesEnLote++;
          continue;
        }

        // REGLA 5: Actualizar con datos limpios
        const precioPrincipalFinal = minPrecio !== Infinity ? minPrecio : 0;
        const supermercadoBaratoFinal = mejorSuper;

        batch.update(doc.ref, {
          preciosPorSupermercado: preciosLimpiosPorSuper,
          precio: precioPrincipalFinal,
          supermercadoMasBarato: supermercadoBaratoFinal,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        actualizadosCount++;
        operacionesEnLote++;
      }

      if (operacionesEnLote > 0) {
        await batch.commit();
      }

      console.log(`⚙️ Progreso: procesados ${Math.min(i + chunkSize, docs.length)} de ${docs.length} documentos...`);
    }

    console.log(`✅ ¡Limpieza y saneamiento de Firestore completados con éxito!`);
    console.log(`🗑️ Documentos basura eliminados definitivamente: ${eliminadosCount}`);
    console.log(`✨ Productos válidos actualizados: ${actualizadosCount}`);

  } catch (error) {
    console.error("❌ Error crítico durante la limpieza de Firestore:", error);
  }
}

if (require.main === module) {
  limpiarYActualizarFirestore().then(() => process.exit(0));
}

module.exports = { limpiarYActualizarFirestore };