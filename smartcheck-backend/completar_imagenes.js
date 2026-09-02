const admin = require('firebase-admin');
const https = require('https');

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

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function consultarOpenFoodFactsArgentina(ean) {
  return new Promise((resolve) => {
    // Apuntamos exclusivamente al nodo de Argentina para asegurar productos comercializados localmente
    const url = `https://ar.openfoodfacts.org/api/v0/product/${ean}.json`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 1 && json.product && json.product.image_front_url) {
            resolve(json.product.image_front_url);
          } else {
            resolve(null);
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

// ==========================================
// 1. PROCESO DE RECUPERACIÓN LOCAL
// ==========================================
async function rellenarImágenesArgentina() {
  console.log("🇦🇷 Buscando productos para enriquecer con el catálogo de Argentina...");

  const snapshot = await db.collection('productos').get();
  
  if (snapshot.empty) {
    console.log("⚠️ No hay productos en Firestore.");
    return;
  }

  let actualizados = 0;
  let omitidos = 0;
  let noEncontrados = 0;

  console.log(`📦 Analizando ${snapshot.size} registros...`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const imagenActual = data.imagen || '';
    const ean = doc.id;

    // Validar que sea un código de barras numérico estándar
    const esCodigoValido = /^\d{8,14}$/.test(ean);

    if (!esCodigoValido) {
      omitidos++;
      continue;
    }

    // Si no tiene imagen, consultamos la base de datos de Argentina
    if (!imagenActual) {
      const imagenReal = await consultarOpenFoodFactsArgentina(ean);

      if (imagenReal) {
        await doc.ref.update({ imagen: imagenReal });
        actualizados++;
        console.log(`✅ [AR] Imagen encontrada para EAN: ${ean} (${data.name || data.nombre || 'Sin nombre'})`);
      } else {
        noEncontrados++;
      }

      await esperar(300); // Pausa de cortesía
    }
  }

  console.log("\n========================================");
  console.log(`🎉 ¡Proceso de sincronización argentina finalizado!`);
  console.log(`- Registros internos omitidos: ${omitidos}`);
  console.log(`- Imágenes oficiales de Argentina agregadas: ${actualizados}`);
  console.log(`- Sin registro en el catálogo local: ${noEncontrados}`);
  console.log("========================================");
}

rellenarImágenesArgentina().then(() => process.exit(0));