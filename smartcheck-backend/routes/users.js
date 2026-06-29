const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const multer = require('multer');

// Configuramos Multer para guardar la foto temporalmente en memoria como un Buffer directo
const upload = multer({ storage: multer.memoryStorage() });

// Registro de usuario nuevo - PROCESAMIENTO MULTIPART SEGURO
router.post('/register', upload.single('imageFile'), async (req, res) => {
    try {
        const { nombre, apellido, email, sexo, dia, mes, anio, localidad, provincia, fotoUrl } = req.body;
        
        // Verificamos si llegó el archivo enviado por el formulario
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No se recibió ningún archivo de imagen" });
        }

        // Cargamos el Buffer binario directo de Multer a Canvas de forma 100% nativa
        const img = await canvas.loadImage(req.file.buffer);

        // Procesamiento de reconocimiento facial
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) {
            return res.status(400).json({ success: false, message: "Rostro no detectado" });
        }

        const fotoStringBase64 = req.file.buffer.toString('base64');

        const newUserDoc = {
            nombre, 
            apellido,
            email: email.toLowerCase().trim(),
            sexo, 
            localidad, 
            provincia,
            fechaNacimiento: `${dia}/${mes}/${anio}`,
            facialDescriptor: Array.from(detection.descriptor),
            faceData: Array.from(detection.descriptor),
            foto: fotoUrl || fotoStringBase64,
            image: fotoStringBase64,
            authMethod: 'face',
            createdAt: new Date(),
            visitas: 0,
            montoSuscripcion: 0
        };

        const db = mongoose.connection.getClient().db('smartcheck');
        await db.collection('users').insertOne(newUserDoc);
        
        res.status(201).json({ success: true, message: "Usuario guardado exitosamente" });
    } catch (e) { 
        console.error("Error interno en registro:", e);
        res.status(500).json({ success: false, message: e.message }); 
    }
});

// Ruta para Login Facial (Adaptado para recibir archivo multipart si se requiere)
router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    try {
        // Si viene un mail manual
        if (req.body.email) {
            const db = mongoose.connection.getClient().db('smartcheck');
            const usuario = await db.collection('users').findOne({ email: req.body.email.toLowerCase().trim() });
            if (!usuario) return res.status(404).json({ status: 'error', mensaje: 'Usuario no encontrado' });
            return res.json({ status: 'success', usuario: usuario.nombre, email: usuario.email, visitas: usuario.visitas || 0 });
        }
        
        // Si es reconocimiento por foto directo
        if (!req.file) return res.status(400).json({ status: 'error', mensaje: 'No hay foto' });
        
        res.json({ status: 'success', mensaje: "Imagen de login recibida correctamente" });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

// Obtener usuarios 
router.get('/usuarios', async (req, res) => {
    try {
        const db = mongoose.connection.getClient().db('smartcheck');
        const usuarios = await db.collection('users').find().sort({ createdAt: -1 }).toArray();
        res.json({ status: 'success', usuarios });
    } catch (e) { 
        res.status(500).json({ status: 'error', message: e.message }); 
    }
});

module.exports = router;