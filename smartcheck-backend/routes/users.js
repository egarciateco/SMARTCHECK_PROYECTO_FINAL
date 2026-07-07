const express = require('express');
const router = express.Router();
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage() });

router.head('/usuarios', (req, res) => { res.status(200).send(); });

router.post('/register', upload.single('imageFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });
    try {
        const img = await canvas.loadImage(req.file.buffer);
        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const detection = await faceapi.detectSingleFace(img, detectionOptions).withFaceLandmarks().withFaceDescriptor();
            
        if (!detection) return res.status(400).json({ status: 'error', mensaje: 'No se detectó un rostro claro' });
        
        const { nombre, apellido, email, correo, dia, mes, anio, ...datos } = req.body;
        const usuarioExistente = await User.findOne({ email: email.toLowerCase().trim() });
        if (usuarioExistente) return res.status(400).json({ status: 'error', mensaje: 'El email ya existe' });
        
        const arrayDescriptores = Array.from(detection.descriptor);
        const miCanvas = canvas.createCanvas(300, img.height * (300 / img.width));
        const ctx = miCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 300, img.height * (300 / img.width));
        
        const newUser = new User({ 
            nombre, apellido, email: email.toLowerCase().trim(), dia, mes, anio,
            faceDescriptor: arrayDescriptores, facialDescriptor: arrayDescriptores,
            foto: miCanvas.toDataURL('image/jpeg', 0.7), ...datos 
        });
        await newUser.save();
        res.status(200).json({ status: 'success', mensaje: 'Usuario registrado correctamente' });
    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno' });
    }
});

router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'Imagen requerida' });
    try {
        const img = await canvas.loadImage(req.file.buffer);
        const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })).withFaceLandmarks().withFaceDescriptor();
        if (!detection) return res.status(400).json({ status: 'error', mensaje: 'No se escaneó el rostro' });
        
        const usuarios = await User.find({ $or: [{ faceDescriptor: { $exists: true } }, { facialDescriptor: { $exists: true } }] }).lean();
        for (const usuario of usuarios) {
            const desc = new Float32Array(usuario.faceDescriptor?.length > 0 ? usuario.faceDescriptor : usuario.facialDescriptor);
            if (faceapi.euclideanDistance(detection.descriptor, desc) <= 0.50) {
                return res.status(200).json({ 
                    status: 'success', 
                    usuario: { 
                        ...usuario, 
                        id: usuario._id, 
                        dia: usuario.dia || "", 
                        mes: usuario.mes || "", 
                        anio: usuario.anio || "" 
                    } 
                });
            }
        }
        return res.status(401).json({ status: 'error', mensaje: 'Autenticación fallida' });
    } catch (error) {
        res.status(500).json({ status: 'error', mensaje: 'Error en biometría' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const usuario = await User.findOne({ email: email.toLowerCase().trim() }).lean();
        if (!usuario || usuario.password !== password) return res.status(401).json({ status: 'error', mensaje: 'Credenciales incorrectas' });
        
        return res.status(200).json({ 
            status: 'success', 
            usuario: { 
                ...usuario, 
                id: usuario._id, 
                dia: usuario.dia || "", 
                mes: usuario.mes || "", 
                anio: usuario.anio || "" 
            } 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', mensaje: 'Error interno' });
    }
});

// NUEVO ENDPOINT: Ruta para obtener todos los usuarios en el panel de administrador
router.get('/admin', async (req, res) => {
    try {
        // Obtenemos todos los usuarios usando .lean() para que traiga todos los campos de MongoDB incluyendo dia, mes y anio
        const usuarios = await User.find({}).lean();
        res.status(200).json({ status: 'success', usuarios });
    } catch (error) {
        console.error('❌ Error obteniendo la lista de administradores:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error al obtener la telemetría' });
    }
});

module.exports = router;