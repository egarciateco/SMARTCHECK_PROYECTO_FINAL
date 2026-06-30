const express = require('express');
const router = express.Router();
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });

        // 1. Respondemos inmediatamente para evitar que Render cierre la conexión (Timeout 502)
        res.status(202).json({ status: 'processing', mensaje: 'Procesando registro en segundo plano...' });

        // 2. Procesamos la IA después de haber enviado la respuesta al cliente
        const img = await canvas.loadImage(req.file.buffer);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) {
            console.error('Error: No se detectó rostro');
            return;
        }

        const { nombre, apellido, email, ...datos } = req.body;
        const newUser = new User({ 
            nombre, 
            apellido, 
            email, 
            faceDescriptor: detection.descriptor, 
            ...datos 
        });
        await newUser.save();
        console.log('✅ Usuario registrado exitosamente en BD');

    } catch (error) {
        console.error('Error crítico en registro:', error);
    }
});

router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'No se envió imagen' });

        const img = await canvas.loadImage(req.file.buffer);
        // Usamos detectSingleFace y withFaceLandmarks().withFaceDescriptor() 
        // para asegurar compatibilidad con modelos precargados
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'Rostro no detectado' });
        }

        res.json({ status: 'success', data: detection.descriptor });
    } catch (error) {
        console.error('Error en biometría:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno en biometría' });
    }
});

module.exports = router;