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
        const usuarioExistente = await User.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ status: 'error', mensaje: 'El email ya se encuentra registrado' });
        }

        const newUser = new User({ 
            nombre, 
            apellido, 
            email, 
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

// 2. RUTA DE INICIO DE SESIÓN BIOMÉTRICO (LOGIN)
router.post('/login', upload.single('imageFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida para verificación' });
    }

    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ status: 'error', mensaje: 'El email es requerido' });
        }

        // Buscar al usuario por el email canónico
        const usuario = await User.findOne({ email });
        if (!usuario || !usuario.faceDescriptor || usuario.faceDescriptor.length === 0) {
            return res.status(404).json({ status: 'error', mensaje: 'Usuario no encontrado o sin datos biométricos' });
        }

        // Procesar la foto actual del login
        const img = await canvas.loadImage(req.file.buffer);
        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const loginDetection = await faceapi.detectSingleFace(img, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!loginDetection) {
            return res.status(400).json({ status: 'error', mensaje: 'No se pudo escanear el rostro claramente' });
        }

        // Comparar el descriptor nuevo con el guardado en la base de datos
        const descriptorGuardado = new Float32Array(usuario.faceDescriptor);
        const descriptorActual = loginDetection.descriptor;

        // Calcula la distancia euclidiana (menor distancia = mayor similitud)
        const distancia = faceapi.euclideanDistance(descriptorActual, descriptorGuardado);
        console.log(`🔍 Distancia biométrica calculada: ${distancia}`);

        // Umbral estándar: 0.6 o menos significa que es la misma persona
        if (distancia > 0.6) {
            return res.status(401).json({ status: 'error', mensaje: 'Autenticación fallida: El rostro no coincide' });
        }

        console.log(`✅ Login exitoso para: ${usuario.email}`);
        res.status(200).json({ 
            status: 'success', 
            mensaje: 'Autenticación exitosa',
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email
            }
        });

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