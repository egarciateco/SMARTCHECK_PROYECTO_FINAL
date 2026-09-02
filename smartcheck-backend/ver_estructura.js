const admin = require('firebase-admin');

// ==========================================
// INICIALIZACIÓN
// ==========================================
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ==========================================
// FUNCIÓN PARA VER LA ESTRUCTURA
// ==========================================
async function verEstructuraFirestore() {
  console.log("🔍 Leyendo una muestra de la base de datos de Firestore...");

  try {
    const snapshot = await db.collection('productos').limit(3).get();

    if (snapshot.empty) {
      console.log("⚠️ La colección 'productos' está vacía o no existe.");
      return;
    }

    snapshot.forEach((doc, index) => {
      console.log(`\n========================================`);
      console.log(`📄 Documento #${index + 1} (ID: ${doc.id})`);
      console.log(`========================================`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });

    console.log("\n✅ Diagnóstico completado.");
  } catch (error) {
    console.error("❌ Error al leer Firestore:", error);
  }
}

verEstructuraFirestore().then(() => process.exit(0));