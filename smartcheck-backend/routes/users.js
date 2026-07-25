const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const sharp = require('sharp');
const path = require('path');

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const db = admin.firestore();

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

// RUTA TEST STATUS
router.get('/', (req, res) => {
    res.json({ status: 'success', mensaje: 'Conexión exitosa a la API de usuarios' });
});

// OBTENER LISTA COMPLETA DE USUARIOS (Para el Admin Panel)
router.get('/usuarios', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const usuarios = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        return res.json({
            status: 'success',
            usuarios: usuarios
        });
    } catch (error) {
        console.error('Error al obtener lista de usuarios:', error);
        return res.status(500).json({
            status: 'error',
            mensaje: 'Error al obtener los usuarios de la base de datos'
        });
    }
});

// REGISTRO FACIAL ROBUSTO CON ROLLBACK
router.post('/register-facial', upload.single('imageFile'), async (req, res) => {
    let createdAuthUser = null;

    try {
        const { nombre, apellido, email, sexo, localidad, provincia, fechaNacimiento } = req.body;
        
        if (!nombre || !apellido || !email || !sexo || !req.file) {
            return res.status(400).json({ status: 'error', mensaje: 'Faltan campos obligatorios' });
        }

        const emailFinal = email.toLowerCase().trim();

        // 1. VERIFICAR SI YA EXISTE EN FIREBASE AUTH
        try {
            await admin.auth().getUserByEmail(emailFinal);
            return res.status(400).json({ status: 'error', mensaje: 'El email ya está registrado' });
        } catch (authCheckErr) {
            if (authCheckErr.code !== 'auth/user-not-found') {
                throw authCheckErr;
            }
        }

        // 2. VERIFICAR SI YA EXISTE EN FIRESTORE
        const existing = await db.collection('users').where('email', '==', emailFinal).get();
        if (!existing.empty) {
            return res.status(400).json({ status: 'error', mensaje: 'El email ya está registrado' });
        }

        // 3. OPTIMIZAR Y REDIMENSIONAR IMAGEN CON SHARP
        const bufferCorregido = await sharp(req.file.buffer)
            .rotate()
            .resize(400, 400, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();

        const img = await canvas.loadImage(bufferCorregido);
        
        // 4. DETECCIÓN FACIAL CON FACE-API
        const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'No se detectó un rostro claro. Mejora la iluminación.' });
        }

        const base64Foto = `data:image/jpeg;base64,${bufferCorregido.toString('base64')}`;

        // 5. CREAR USUARIO EN FIREBASE AUTHENTICATION
        createdAuthUser = await admin.auth().createUser({
            email: emailFinal,
            password: req.body.password || (Math.random().toString(36).slice(-12) + "A1!"),
            displayName: `${nombre} ${apellido}`
        });

        // 6. CREAR Y GUARDAR EN FIRESTORE
        const newUser = {
            nombre: nombre || '',
            apellido: apellido || '',
            email: emailFinal,
            sexo: sexo || '',
            localidad: localidad || '',
            provincia: provincia || '',
            fechaNacimiento: fechaNacimiento || '',
            foto: base64Foto || '',
            uid: createdAuthUser.uid,
            faceDescriptor: Array.from(detection.descriptor),
            createdAt: new Date().toISOString()
        };

        await db.collection('users').doc(createdAuthUser.uid).set(newUser);
        return res.status(201).json({ status: 'success', usuario: newUser });
        
    } catch (error) {
        console.error('Error en /register-facial:', error);

        if (createdAuthUser) {
            try {
                await admin.auth().deleteUser(createdAuthUser.uid);
                console.log("⚠️ Rollback: Usuario eliminado de Auth para mantener consistencia.");
            } catch (deleteErr) {
                console.error("Error realizando rollback:", deleteErr);
            }
        }

        return res.status(500).json({ status: 'error', mensaje: error.message || 'Error al procesar el registro' });
    }
});

// BIOMETRÍA
router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', mensaje: 'No hay imagen' });
        }

        const bufferCorregido = await sharp(req.file.buffer).rotate().toBuffer();
        const img = await canvas.loadImage(bufferCorregido);
        
        const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'No se detectó rostro' });
        }

        const snapshot = await db.collection('users').get();
        let bestMatch = null;
        let bestDistance = 0.75;

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
            res.json({ status: 'success', usuario: bestMatch });
        } else {
            res.status(401).json({ status: 'error', mensaje: 'Rostro no reconocido' });
        }
    } catch (error) {
        console.error('Error en biometría:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error al procesar biometría' });
    }
});

// ACTUALIZAR UBICACIÓN
router.post('/actualizar-ubicacion', async (req, res) => {
    try {
        const { uid, localidad, provincia } = req.body;
        
        if (!uid) {
            return res.status(400).json({ status: 'error', mensaje: 'Falta el ID del usuario' });
        }

        await db.collection('users').doc(uid).update({
            localidad: localidad || '',
            provincia: provincia || '',
            ultimaActualizacion: new Date().toISOString()
        });

        res.json({ status: 'success', mensaje: 'Ubicación actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar ubicación:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error al procesar la actualización' });
    }
});

module.exports = router;