const express = require('express');
const router = express.Router();
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage() });

// 1. RUTA DE REGISTRO (CORREGIDA SIN DUPLICADOS)
router.post('/register', upload.single('imageFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });
    }

    try {
        // Cargar imagen desde el buffer
        const img = await canvas.loadImage(req.file.buffer);
        
        // Procesar detección usando SsdMobilenetv1
        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const detection = await faceapi.detectSingleFace(img, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();
            
        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'No se detectó un rostro claro' });
        }

        // Extraemos 'correo' para ignorarlo y evitar que se guarde duplicado en ...datos
        const { nombre, apellido, email, correo, ...datos } = req.body;

        // Validar si el email principal ya existe
        const usuarioExistente = await User.findOne({ email: email.toLowerCase().trim() });
        if (usuarioExistente) {
            return res.status(400).json({ status: 'error', mensaje: 'El email ya se encuentra registrado' });
        }

        const newUser = new User({ 
            nombre, 
            apellido, 
            email: email.toLowerCase().trim(), 
            faceDescriptor: Array.from(detection.descriptor), 
            ...datos 
        });

        await newUser.save();
        
        console.log('✅ Usuario guardado de forma limpia en MongoDB');
        res.status(200).json({ status: 'success', mensaje: 'Usuario registrado correctamente' });

    } catch (error) {
        console.error('❌ Error crítico en registro:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno en el servidor' });
    }
});

// 2. RUTA DE INICIO DE SESIÓN BIOMÉTRICO ÁGIL (LOGIN 1 A N - RECONOCIMIENTO GLOBAL)
router.post('/login', upload.single('imageFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida para verificación' });
    }

    try {
        // Procesar la foto actual del login enviada por el celular
        const img = await canvas.loadImage(req.file.buffer);
        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const loginDetection = await faceapi.detectSingleFace(img, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!loginDetection) {
            return res.status(400).json({ status: 'error', mensaje: 'No se pudo escanear el rostro claramente. Intente de nuevo.' });
        }

        const descriptorActual = loginDetection.descriptor;

        // 1. Buscamos TODOS los usuarios que tengan datos biométricos guardados
        const usuarios = await User.find({ faceDescriptor: { $exists: true, $not: { $size: 0 } } });

        // 2. Iteramos para encontrar un match por distancia euclidiana
        for (const usuario of usuarios) {
            // Reconstituimos el array guardado a Float32Array para usar con face-api
            const descriptorGuardado = new Float32Array(usuario.faceDescriptor);

            // Calcula la distancia euclidiana
            const distancia = faceapi.euclideanDistance(descriptorActual, descriptorGuardado);

            // Umbral de tolerancia ajustable (0.48 - 0.52 es ideal para evitar falsos positivos y ser veloz)
            if (distancia <= 0.50) {
                console.log(`✅ Match biométrico exitoso. Distancia: ${distancia} para: ${usuario.email}`);
                
                return res.status(200).json({ 
                    status: 'success', 
                    mensaje: `¡Bienvenido de vuelta, ${usuario.nombre}!`,
                    usuario: {
                        id: usuario._id,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        email: usuario.email
                    }
                });
            }
        }

        // Si recorrió todos los usuarios y ninguno matcheó
        console.log('❌ Intento de Login Facial fallido: Rostro no coincide con ningún usuario');
        return res.status(401).json({ status: 'error', mensaje: 'Autenticación fallida: El rostro no pertenece a ninguna cuenta registrada' });

    } catch (error) {
        console.error('❌ Error crítico en login:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno durante la autenticación' });
    }
});

// Ruta auxiliar para pruebas de biometría limpia
router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', mensaje: 'No se envió imagen' });
        }

        const img = await canvas.loadImage(req.file.buffer);
        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const detection = await faceapi.detectSingleFace(img, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'Rostro no detectado' });
        }

        res.json({ status: 'success', data: Array.from(detection.descriptor) });
    } catch (error) {
        console.error('Error en biometría:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno en biometría' });
    }
});

module.exports = router;