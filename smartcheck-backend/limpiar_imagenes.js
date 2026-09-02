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
// 1. FUNCIÓN DE LIMPIEZA DE IMÁGENES CORRUPTAS
// ==========================================
async function limpiarImagenesCorruptas() {
  console.log("🧹 Iniciando limpieza profunda de imágenes en Firestore...");
  
  const snapshot = await db.collection('productos').get();
  
  if (snapshot.empty) {
    console.log("⚠️ No hay productos en Firestore.");
    return;
  }

  let batch = db.batch();
  let contadorLote = 0;
  let totalModificados = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const imagen = data.imagen || '';

    // Criterios para considerar la imagen corrupta, cruzada o inválida:
    // 1. Contiene la URL basura repetida (ej: "205546")
    // 2. Es una cadena muy corta que no es una URL real
    const esCorrupta = imagen.includes('205546') || (imagen.length > 0 && imagen.length < 15);

    if (esCorrupta) {
      // Blanqueamos el campo imagen para eliminar el error visual
      batch.update(doc.ref, { imagen: '' });
      contadorLote++;
      totalModificados++;

      // Firestore limita los batch a un máximo de 500 operaciones simultáneas
      if (contadorLote >= 400) {
        // Nota: Para simplificar el ejemplo ejecutamos de forma secuencial o por lotes controlados
      }
    }
  });

  // Ejecutamos la actualización masiva por lotes seguros
  const docs = snapshot.docs;
  let batchActual = db.batch();
  let operacionesEnLote = 0;

  for (const doc of docs) {
    const data = doc.data();
    const imagen = data.imagen || '';

    // Si tiene la URL basura o es inválida
    if (imagen.includes('205546') || (imagen.length > 0 && imagen.length < 15)) {
      batchActual.update(doc.ref, { imagen: '' });
      operacionesEnLote++;
      totalModificados++;

      if (operacionesEnLote >= 400) {
        await batchActual.commit();
        batchActual = db.batch();
        operacionesEnLote = 0;
      }
    }
  }

  if (operacionesEnLote > 0) {
    await batchActual.commit();
  }

  console.log(`✅ ¡Limpieza completada! Se blanquearon ${totalModificados} imágenes cruzadas o defectuosas en Firestore.`);
}

limpiarImagenesCorruptas().then(() => process.exit(0));