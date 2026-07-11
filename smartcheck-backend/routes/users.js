const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');

const db = admin.firestore();
const upload = multer({ storage: multer.memoryStorage() });

// --- RUTA PARA EL PANEL DE ADMINISTRACIÓN ---
router.get('/usuarios', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ status: 'success', usuarios });
    } catch (error) {
        console.error('❌ Error al obtener usuarios:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno' });
    }
});

// --- RUTA DE REGISTRO (CON AUTH, FIRESTORE Y ACTUALIZACIÓN EN TIEMPO REAL) ---
router.post('/register', upload.single('imageFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });
    
    try {
        const img = await canvas.loadImage(req.file.buffer);
        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const detection = await faceapi.detectSingleFace(img, detectionOptions).withFaceLandmarks().withFaceDescriptor();
            
        if (!detection) return res.status(400).json({ status: 'error', mensaje: 'No se detectó un rostro claro' });
        
        const { nombre, apellido, email, correo, dia, mes, anio, fechaNacimiento, ...datos } = req.body;
        const emailFinal = (email || correo || '').toLowerCase().trim();

        // 0. Validar primero si el usuario ya existe en Firestore para mantener consistencia
        const existingUser = await db.collection('users').where('email', '==', emailFinal).get();
        if (!existingUser.empty) {
            return res.status(400).json({ status: 'error', mensaje: 'El email ya está registrado en la base de datos' });
        }

        // 1. Crear el usuario en Firebase Authentication
        const passwordTemp = Math.random().toString(36).slice(-10) + "A1!"; 
        const userRecord = await admin.auth().createUser({
            email: emailFinal,
            password: passwordTemp,
            displayName: `${nombre} ${apellido}`
        });

        // 2. Guardar en Firestore usando el UID de Auth
        const arrayDescriptores = Array.from(detection.descriptor);
        const newUser = {
            uid: userRecord.uid,
            nombre, apellido, email: emailFinal, correo: emailFinal,
            dia, mes, anio,
            fechaNacimiento: fechaNacimiento || (dia && mes && anio ? `${dia}/${mes}/${anio}` : null),
            faceDescriptor: arrayDescriptores,
            facialDescriptor: arrayDescriptores,
            foto: null,
            ...datos,
            createdAt: new Date().toISOString()
        };

        await db.collection('users').doc(userRecord.uid).set(newUser);

        // 3. DISPARADOR PARA PANEL DE ADMINISTRADOR (SOCKET.IO)
        const io = req.app.get('io');
        if (io) {
            io.emit('actualizar_panel');
        }

        res.status(200).json({ status: 'success', mensaje: 'Usuario registrado correctamente' });
    } catch (error) {
        console.error('❌ Error en registro:', error);
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({ status: 'error', mensaje: 'El email ya existe en Auth' });
        }
        res.status(500).json({ status: 'error', mensaje: 'Error interno al registrar' });
    }
});

// --- RUTA BIOMETRÍA ---
router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });
    
    try {
        const img = await canvas.loadImage(req.file.buffer);
        const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })).withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) return res.status(400).json({ status: 'error', mensaje: 'No se escaneó el rostro' });
        
        const snapshot = await db.collection('users').get();
        
        for (const doc of snapshot.docs) {
            const usuario = doc.data();
            const descArray = usuario.faceDescriptor || usuario.facialDescriptor;
            
            if (descArray) {
                const desc = new Float32Array(descArray);
                if (faceapi.euclideanDistance(detection.descriptor, desc) <= 0.60) {
                    return res.status(200).json({ 
                        status: 'success', 
                        usuario: { ...usuario, id: doc.id } 
                    });
                }
            }
        }
        return res.status(401).json({ status: 'error', mensaje: 'Autenticación fallida: Rostro no reconocido' });
    } catch (error) {
        console.error('❌ Error en biometría:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error en procesamiento facial' });
    }
});

module.exports = router;