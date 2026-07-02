const express = require('express');
const router = express.Router();
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage() });

// 1. RUTA DE REGISTRO (Guarda el descriptor y la foto real optimizada)
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

        // --- OPTIMIZACIÓN Y CONVERSIÓN DE LA FOTO A BASE64 ---
        // Redimensionamos la foto con un canvas pequeño para que no ocupe espacio innecesario en MongoDB
        const maxAncho = 300;
        const escala = maxAncho / img.width;
        const altoDestino = img.height * escala;

        const miCanvas = canvas.createCanvas(maxAncho, altoDestino);
        const ctx = miCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, maxAncho, altoDestino);
        
        // Genera la URI en string comprimido base64 (Formato apto para la etiqueta <Image> de Expo)
        const fotoBase64 = miCanvas.toDataURL('image/jpeg', 0.7);

        const newUser = new User({ 
            nombre, 
            apellido, 
            email: email.toLowerCase().trim(), 
            faceDescriptor: arrayDescriptores, 
            facialDescriptor: arrayDescriptores,
            foto: fotoBase64, // <--- Guardamos la foto en la base de datos
            ...datos 
        });

        await newUser.save();
        res.status(200).json({ status: 'success', mensaje: 'Usuario registrado correctamente' });

    } catch (error) {
        console.error('❌ Error crítico en registro:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno en el servidor' });
    }
});

// 2. RUTA DE LOGIN (Envía los descriptores, nombre y FOTO REAL a la app)
router.post('/login', upload.single('imageFile'), async (req, res) => {
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
            return res.status(400).json({ status: 'error', mensaje: 'No se pudo escanear el rostro claramente. Intente de nuevo.' });
        }

        const descriptorActual = loginDetection.descriptor;

        const usuarios = await User.find({
            $or: [
                { faceDescriptor: { $exists: true, $not: { $size: 0 } } },
                { facialDescriptor: { $exists: true, $not: { $size: 0 } } }
            ]
        });

        for (const usuario of usuarios) {
            const datosBiometricos = (usuario.faceDescriptor && usuario.faceDescriptor.length > 0) 
                ? usuario.faceDescriptor 
                : usuario.facialDescriptor;

            const descriptorGuardado = new Float32Array(datosBiometricos);
            const distancia = faceapi.euclideanDistance(descriptorActual, descriptorGuardado);

            if (distancia <= 0.50) {
                console.log(`✅ Match exitoso (Distancia: ${distancia}) para: ${usuario.email}`);
                
                return res.status(200).json({ 
                    status: 'success', 
                    mensaje: `¡Bienvenido de vuelta, ${usuario.nombre}!`,
                    usuario: {
                        id: usuario._id,
                        _id: usuario._id,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        email: usuario.email,
                        sexo: usuario.sexo || 'M',
                        foto: usuario.foto || null, // <--- ¡Clave! Aquí viaja la foto real del usuario hacia todas tus pantallas
                        faceDescriptor: datosBiometricos,
                        facialDescriptor: datosBiometricos 
                    }
                });
            }
        }

        return res.status(401).json({ status: 'error', mensaje: 'Autenticación fallida: El rostro no pertenece a ninguna cuenta registrada' });

    } catch (error) {
        console.error('❌ Error crítico en login:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno durante la autenticación' });
    }
});

module.exports = router;