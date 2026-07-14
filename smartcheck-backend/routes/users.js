const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');

const db = admin.firestore();
const upload = multer({ storage: multer.memoryStorage() });

// --- RUTA NUEVA: PRUEBA DE CONEXIÓN ---
router.get('/prueba-conexion', (req, res) => {
    return res.status(200).json({ status: 'ok', mensaje: 'El servidor está vivo' });
});

// --- RUTA: OBTENER PERFIL SIN BIOMETRÍA ---
router.get('/profile/:email', async (req, res) => {
    try {
        const email = req.params.email.toLowerCase().trim();
        const snapshot = await db.collection('users').where('email', '==', email).get();
        
        if (snapshot.empty) {
            return res.status(404).json({ status: 'error', mensaje: 'Usuario no encontrado' });
        }
        
        const userData = snapshot.docs[0].data();
        res.status(200).json({ status: 'success', usuario: { ...userData, id: snapshot.docs[0].id } });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error al buscar perfil' });
    }
});

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

// --- RUTA: ACTUALIZAR UBICACIÓN AUTOMÁTICA ---
router.post('/actualizar-ubicacion', async (req, res) => {
    try {
        const { email, provincia, localidad } = req.body;
        if (!email) return res.status(400).json({ status: 'error', mensaje: 'Email requerido' });

        const emailLower = email.toLowerCase().trim();
        const snapshot = await db.collection('users').where('email', '==', emailLower).get();
        
        if (snapshot.empty) {
            return res.status(404).json({ status: 'error', mensaje: 'Usuario no encontrado' });
        }

        await snapshot.docs[0].ref.update({
            provincia: provincia || "Desconocida",
            localidad: localidad || "Desconocida",
            ultimaActualizacionGeo: new Date().toISOString()
        });

        res.status(200).json({ status: 'success', mensaje: 'Ubicación actualizada' });
    } catch (error) {
        console.error('Error al actualizar ubicación:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error al actualizar' });
    }
});

// --- RUTA DE REGISTRO ---
router.post('/register', upload.single('imageFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });
    
    try {
        const img = await canvas.loadImage(req.file.buffer);
        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const detection = await faceapi.detectSingleFace(img, detectionOptions).withFaceLandmarks().withFaceDescriptor();
            
        if (!detection) return res.status(400).json({ status: 'error', mensaje: 'No se detectó un rostro claro' });
        
        const { nombre, apellido, email, correo, dia, mes, anio, fechaNacimiento, ...datos } = req.body;
        const emailFinal = (email || correo || '').toLowerCase().trim();

        const existingUser = await db.collection('users').where('email', '==', emailFinal).get();
        if (!existingUser.empty) {
            return res.status(400).json({ status: 'error', mensaje: 'El email ya está registrado' });
        }

        const passwordTemp = Math.random().toString(36).slice(-10) + "A1!"; 
        const userRecord = await admin.auth().createUser({
            email: emailFinal,
            password: passwordTemp,
            displayName: `${nombre} ${apellido}`
        });

        const fotoBase64 = req.file ? `data:image/jpeg;base64,${req.file.buffer.toString('base64')}` : null;
        const arrayDescriptores = Array.from(detection.descriptor);
        
        const newUser = {
            uid: userRecord.uid,
            nombre, apellido, email: emailFinal, correo: emailFinal,
            dia, mes, anio,
            fechaNacimiento: fechaNacimiento || (dia && mes && anio ? `${dia}/${mes}/${anio}` : null),
            faceDescriptor: arrayDescriptores,
            facialDescriptor: arrayDescriptores,
            foto: fotoBase64,
            ...datos,
            createdAt: new Date().toISOString()
        };

        await db.collection('users').doc(userRecord.uid).set(newUser);
        const io = req.app.get('io');
        if (io) io.emit('actualizar_panel');

        res.status(200).json({ status: 'success', mensaje: 'Usuario registrado correctamente' });
    } catch (error) {
        console.error('❌ Error en registro:', error);
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({ status: 'error', mensaje: 'El email ya existe' });
        }
        res.status(500).json({ status: 'error', mensaje: 'Error interno al registrar' });
    }
});

// --- RUTA BIOMETRÍA (OPTIMIZADA) ---
router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });
    
    try {
        const img = await canvas.loadImage(req.file.buffer);
        // CAMBIO AQUÍ: TinyFaceDetectorOptions optimiza el consumo de RAM
        const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 128 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        
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