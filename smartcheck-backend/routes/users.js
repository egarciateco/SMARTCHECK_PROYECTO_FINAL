const express = require('express');
const router = express.Router();
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage() });

// Ruta para verificar estado (usada por WelcomeScreen)
router.head('/usuarios', (req, res) => {
    res.status(200).send();
});

// 1. RUTA DE REGISTRO
router.post('/register', upload.single('imageFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });
    }
    try {
        const img = await canvas.loadImage(req.file.buffer);
        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const detection = await faceapi.detectSingleFace(img, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();
            
        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'No se detectó un rostro claro' });
        }
        const { nombre, apellido, email, correo, ...datos } = req.body;
        const usuarioExistente = await User.findOne({ email: email.toLowerCase().trim() });
        if (usuarioExistente) {
            return res.status(400).json({ status: 'error', mensaje: 'El email ya se encuentra registrado' });
        }
        const arrayDescriptores = Array.from(detection.descriptor);
        const maxAncho = 300;
        const escala = maxAncho / img.width;
        const altoDestino = img.height * escala;
        const miCanvas = canvas.createCanvas(maxAncho, altoDestino);
        const ctx = miCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, maxAncho, altoDestino);
        const fotoBase64 = miCanvas.toDataURL('image/jpeg', 0.7);
        const newUser = new User({ 
            nombre, apellido, email: email.toLowerCase().trim(), 
            faceDescriptor: arrayDescriptores, facialDescriptor: arrayDescriptores,
            foto: fotoBase64, ...datos 
        });
        await newUser.save();
        res.status(200).json({ status: 'success', mensaje: 'Usuario registrado correctamente' });
    } catch (error) {
        console.error('❌ Error crítico en registro:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno en el servidor' });
    }
});

// 2. RUTA DE LOGIN/BIOMETRIA
router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida para verificación' });
    }
    try {
        const img = await canvas.loadImage(req.file.buffer);
        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const loginDetection = await faceapi.detectSingleFace(img, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!loginDetection) {
            return res.status(400).json({ status: 'error', mensaje: 'No se pudo escanear el rostro claramente.' });
        }
        const descriptorActual = loginDetection.descriptor;
        const usuarios = await User.find({
            $or: [
                { faceDescriptor: { $exists: true, $not: { $size: 0 } } },
                { facialDescriptor: { $exists: true, $not: { $size: 0 } } }
            ]
        }).lean();

        for (const usuario of usuarios) {
            const datosBiometricos = (usuario.faceDescriptor && usuario.faceDescriptor.length > 0) 
                ? usuario.faceDescriptor : usuario.facialDescriptor;
            if (!datosBiometricos || datosBiometricos.length === 0) continue;
            const descriptorGuardado = new Float32Array(datosBiometricos);
            const distancia = faceapi.euclideanDistance(descriptorActual, descriptorGuardado);
            if (distancia <= 0.50) {
                const fotoFinal = usuario.foto || usuario.Foto || usuario.image || usuario.imagen || null;
                return res.status(200).json({ 
                    status: 'success', 
                    mensaje: `¡Bienvenido de vuelta, ${usuario.nombre}!`,
                    usuario: { id: usuario._id, _id: usuario._id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, sexo: usuario.sexo || 'M', foto: fotoFinal }
                });
            }
        }
        return res.status(401).json({ status: 'error', mensaje: 'Autenticación fallida' });
    } catch (error) {
        console.error('❌ Error crítico en login:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno durante la autenticación' });
    }
});

module.exports = router;