const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');

// --- Configuración de Canvas ---
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const db = admin.firestore();

// --- Carga de Modelos de IA ---
async function loadModels() {
    const MODEL_URL = path.join(__dirname, '../weights'); 
    try {
        await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL); 
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
        console.log("✅ Modelos de IA cargados correctamente.");
    } catch (error) {
        console.error("❌ Error cargando modelos:", error);
    }
}
loadModels();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 } 
});

// ==================== RUTAS ====================

// ESTA ES LA LÍNEA QUE FALTABA PARA EVITAR EL 404
router.get('/', (req, res) => {
    res.json({ status: 'success', mensaje: 'Conexión exitosa a la API de usuarios' });
});

router.get('/prueba-conexion', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Backend funcionando' });
});

router.post('/register-facial', upload.single('imageFile'), async (req, res) => {
  try {
    const { nombre, apellido, email, password, sexo, fechaNacimiento, ...otros } = req.body;
    
    if (!nombre || !apellido || !email || !sexo || !req.file) {
      return res.status(400).json({ status: 'error', mensaje: 'Faltan campos obligatorios' });
    }

    const img = await canvas.loadImage(req.file.buffer);
    const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection) {
      return res.status(400).json({ status: 'error', mensaje: 'No se detectó un rostro claro.' });
    }

    const emailFinal = email.toLowerCase().trim();
    const existing = await db.collection('users').where('email', '==', emailFinal).get();
    
    if (!existing.empty) {
      return res.status(400).json({ status: 'error', mensaje: 'El email ya está registrado' });
    }

    const userRecord = await admin.auth().createUser({
      email: emailFinal,
      password: password || (Math.random().toString(36).slice(-12) + "A1!"),
      displayName: `${nombre} ${apellido}`
    });

    const newUser = {
      uid: userRecord.uid,
      nombre, apellido, email: emailFinal, sexo, fechaNacimiento,
      faceDescriptor: Array.from(detection.descriptor),
      createdAt: new Date().toISOString(),
      ...otros
    };

    await db.collection('users').doc(userRecord.uid).set(newUser);
    res.status(201).json({ status: 'success', usuario: newUser });
    
  } catch (error) {
    console.error('Error en /register-facial:', error);
    res.status(500).json({ status: 'error', mensaje: error.message });
  }
});

router.post('/biometria', upload.single('imageFile'), async (req, res) => {
  console.log("🚀 LLEGÓ UNA PETICIÓN A /biometria");
  
  if (!req.file) {
      console.error("❌ Error: No se recibió ningún archivo (imageFile)");
      return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });
  }

  try {
    console.log("🔍 Procesando imagen recibida...");
    const img = await canvas.loadImage(req.file.buffer);
    const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return res.status(400).json({ status: 'error', mensaje: 'No se detectó rostro' });
    }

    const snapshot = await db.collection('users').get();
    let bestMatch = null;
    let bestDistance = 0.6; 

    for (const doc of snapshot.docs) {
      const user = doc.data();
      const desc = user.faceDescriptor;
      if (desc) {
        const distance = faceapi.euclideanDistance(detection.descriptor, new Float32Array(desc));
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = { id: doc.id, ...user };
        }
      }
    }

    if (bestMatch) {
      console.log("✅ Usuario reconocido:", bestMatch.email);
      res.json({ status: 'success', usuario: bestMatch });
    } else {
      console.log("❌ Rostro no reconocido en base de datos");
      res.status(401).json({ status: 'error', mensaje: 'Rostro no reconocido' });
    }
  } catch (error) {
    console.error('❌ Error en /biometria:', error);
    res.status(500).json({ status: 'error', mensaje: 'Error al procesar biometría' });
  }
});

module.exports = router;