const express = require('express');
const router = express.Router();
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const User = require('../models/User'); // Asumiendo que esta es tu ruta de modelo

const upload = multer({ storage: multer.memoryStorage() });

// Mantenemos toda tu lógica original de rutas aquí
router.post('/register', upload.single('imageFile'), async (req, res) => {
    try {
        // Tu lógica de registro original...
        const { nombre, apellido, email, ...datos } = req.body;
        
        // Procesamiento facial para registro
        const img = await canvas.loadImage(req.file.buffer);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'No se detectó rostro' });
        }

        // Guardado en BD...
        const newUser = new User({ nombre, apellido, email, faceDescriptor: detection.descriptor, ...datos });
        await newUser.save();
        
        res.json({ status: 'success', mensaje: 'Usuario registrado' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno' });
    }
});

router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'No se envió imagen' });

        const img = await canvas.loadImage(req.file.buffer);
        // Ahora, al usar el modelo ya cargado globalmente en server.js, 
        // esta llamada no causará el error 502.
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceRecognition();

        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'Rostro no detectado' });
        }

        // Tu lógica de comparación biométrica original...
        res.json({ status: 'success', data: detection });
    } catch (error) {
        console.error('Error en biometría:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno en biometría' });
    }
});

module.exports = router;