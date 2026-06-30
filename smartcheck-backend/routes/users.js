const express = require('express');
const router = express.Router();
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.single('imageFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });

    // 1. Respondemos inmediatamente al usuario para evitar el 502
    res.status(202).json({ status: 'processing', mensaje: 'Procesando registro...' });

    // 2. Procesamos la IA en un bloque separado (Asíncrono)
    (async () => {
        try {
            const img = await canvas.loadImage(req.file.buffer);
            const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            
            if (detection) {
                const { nombre, apellido, email, ...datos } = req.body;
                const newUser = new User({ 
                    nombre, 
                    apellido, 
                    email, 
                    faceDescriptor: Array.from(detection.descriptor), // Convertimos a array puro
                    ...datos 
                });
                await newUser.save();
                console.log('✅ Usuario guardado exitosamente en MongoDB');
            } else {
                console.log('❌ Falló la detección facial en el registro');
            }
        } catch (error) {
            console.error('❌ Error crítico en procesamiento background:', error);
        }
    })();
});

router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'No se envió imagen' });

        const img = await canvas.loadImage(req.file.buffer);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'Rostro no detectado' });
        }

        // Devolvemos el descriptor para que el frontend lo compare
        res.json({ status: 'success', data: Array.from(detection.descriptor) });
    } catch (error) {
        console.error('Error en biometría:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno en biometría' });
    }
});

module.exports = router;