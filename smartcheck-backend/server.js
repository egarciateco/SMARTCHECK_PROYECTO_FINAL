const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Inicialización de Firebase Admin SDK
if (!admin.apps.length) {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require('./serviceAccountKey.json');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ==========================================
// RUTAS DE ADMINISTRADOR
// ==========================================

// Verificar contraseña del Administrador
app.post('/api/admin/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    const configRef = db.collection('config').doc('admin_settings');
    const doc = await configRef.get();

    let storedPassword = "00192";

    if (doc.exists && doc.data().password) {
      storedPassword = String(doc.data().password);
    } else {
      await configRef.set({ password: "00192" });
    }

    if (String(password) === storedPassword) {
      return res.json({ status: "éxito", access: true });
    } else {
      return res.status(401).json({ status: "error", mensaje: "Contraseña incorrecta" });
    }
  } catch (error) {
    return res.status(500).json({ status: "error", mensaje: error.message });
  }
});

// Cambiar la contraseña del Administrador
app.post('/api/admin/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const configRef = db.collection('config').doc('admin_settings');
    const doc = await configRef.get();

    let storedPassword = doc.exists && doc.data().password ? String(doc.data().password) : "00192";

    if (String(currentPassword) !== storedPassword) {
      return res.status(400).json({ status: "error", mensaje: "La contraseña actual es incorrecta" });
    }

    await configRef.set({ password: String(newPassword) }, { merge: true });
    return res.json({ status: "éxito", mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    return res.status(500).json({ status: "error", mensaje: error.message });
  }
});

// ==========================================
// MONTAR RUTAS DE USUARIOS / PRODUCTOS
// ==========================================
// Asegúrate de que la ruta del archivo router (ej: './routes/users' o './users') coincida con tu estructura de carpetas
const userRoutes = require('./routes/users'); 
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});