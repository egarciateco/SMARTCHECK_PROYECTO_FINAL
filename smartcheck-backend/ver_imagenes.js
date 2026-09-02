const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function revisarCamposDeImagen() {
  console.log("🔍 Analizando cómo se guardan las imágenes en Firestore...");
  
  // Traemos 10 productos al azar para ver sus campos de imagen
  const snapshot = await db.collection('productos').limit(10).get();

  snapshot.forEach((doc, i) => {
    const data = doc.data();
    console.log(`\n----------------------------------------`);
    console.log(`Producto #${i + 1}: ${data.name || data.nombre}`);
    console.log(`- Campo 'imagen':`, data.imagen);
    console.log(`- Campo 'image':`, data.image);
    console.log(`- Campo 'imageUrl':`, data.imageUrl);
    console.log(`- Campo 'foto':`, data.foto);
  });
}

revisarCamposDeImagen().then(() => process.exit(0));