const express = require('express');
const router = express.Router();
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage() });

// Ruta de registro corregida y estabilizada
router.post('/register', upload.single('imageFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });
    }

    try {
        // 1. Cargar imagen desde el buffer
        const img = await canvas.loadImage(req.file.buffer);
        
        // 2. Procesar detección usando SsdMobilenetv1 con minConfidence optimizado
        // El minConfidence: 0.5 ayuda a reducir la carga de trabajo de la IA
        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const detection = await faceapi.detectSingleFace(img, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();
            
        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'No se detectó un rostro claro' });
        }

        // 3. Preparar datos y guardar
        const { nombre, apellido, email, ...datos } = req.body;
        const newUser = new User({ 
            nombre, 
            apellido, 
            email, 
            faceDescriptor: Array.from(detection.descriptor), // Convertimos a array puro para MongoDB
            ...datos 
        });

        // Esperamos a que MongoDB confirme la escritura antes de responder
        await newUser.save();
        
        console.log('✅ Usuario guardado exitosamente en MongoDB');
        res.status(200).json({ status: 'success', mensaje: 'Usuario registrado correctamente' });

    } catch (error) {
        console.error('❌ Error crítico en registro:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno al guardar en la base de datos' });
    }
});

// Ruta de biometría optimizada
router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', mensaje: 'No se envió imagen' });
        }

        const img = await canvas.loadImage(req.file.buffer);
        
        // Usamos la misma configuración eficiente de SsdMobilenetv1
        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const detection = await faceapi.detectSingleFace(img, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();

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