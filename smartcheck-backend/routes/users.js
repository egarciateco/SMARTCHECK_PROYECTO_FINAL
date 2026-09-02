const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const db = admin.firestore();

const multerStorage = multer.memoryStorage();
const upload = multer({ 
    storage: multerStorage,
    limits: { fileSize: 8 * 1024 * 1024 } 
});

// URL del motor de Python (asegúrate de que en Render apunte al servicio correcto si están separados)
const PYTHON_MOTOR_URL = process.env.PYTHON_MOTOR_URL || 'http://localhost:8000';

// RUTA TEST STATUS -> /api/users/
router.get('/', (req, res) => {
    res.json({ status: 'success', mensaje: 'Conexión exitosa a la API de usuarios' });
});

// OBTENER LISTA COMPLETA DE USUARIOS -> /api/users/usuarios
router.get('/usuarios', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const usuarios = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return res.json({ status: 'success', usuarios });
    } catch (error) {
        console.error('Error al obtener lista de usuarios:', error);
        return res.status(500).json({ status: 'error', mensaje: 'Error al obtener los usuarios' });
    }
});

// OBTENER UN USUARIO POR ID -> /api/users/usuario/:id
router.get('/usuario/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userDoc = await db.collection('users').doc(id).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ status: 'error', mensaje: 'Usuario no encontrado' });
        }

        return res.json({ 
            status: 'success', 
            usuario: { id: userDoc.id, ...userDoc.data() } 
        });
    } catch (error) {
        console.error('Error al obtener el usuario por ID:', error);
        return res.status(500).json({ status: 'error', mensaje: 'Error al obtener el usuario' });
    }
});

// REGISTRO FACIAL (Derivado al motor de Python) -> /api/users/register-facial
router.post('/register-facial', upload.single('imageFile'), async (req, res) => {
    try {
        const { nombre, apellido, email, sexo, localidad, provincia, fechaNacimiento } = req.body;
        
        if (!nombre || !apellido || !email || !sexo || !req.file) {
            return res.status(400).json({ status: 'error', mensaje: 'Faltan campos obligatorios' });
        }

        const emailFinal = email.toLowerCase().trim();

        // Verificar si ya existe en Firebase Auth / Firestore
        try {
            await admin.auth().getUserByEmail(emailFinal);
            return res.status(400).json({ status: 'error', mensaje: 'El email ya está registrado' });
        } catch (authCheckErr) {
            if (authCheckErr.code !== 'auth/user-not-found') throw authCheckErr;
        }

        // Enviar la imagen al motor de Python para procesar el vector facial
        const formData = new FormData();
        formData.append('imageFile', req.file.buffer, { filename: req.file.originalname || 'face.jpg' });

        let pythonResponse;
        try {
            pythonResponse = await axios.post(`${PYTHON_MOTOR_URL}/register-facial`, formData, {
                headers: formData.getHeaders(),
                timeout: 15000 // 15 segundos de tolerancia
            });
        } catch (pyError) {
            console.error('Error detallado de Python:', pyError.response?.data || pyError.message);
            return res.status(400).json({ 
                status: 'error', 
                mensaje: pyError.response?.data?.mensaje || 'No se pudo procesar el rostro en el motor de IA.' 
            });
        }

        const { faceDescriptor, base64Foto } = pythonResponse.data;

        const createdAuthUser = await admin.auth().createUser({
            email: emailFinal,
            password: req.body.password || (Math.random().toString(36).slice(-12) + "A1!"),
            displayName: `${nombre} ${apellido}`
        });

        // Generar la fecha de registro actual en formato DD/MM/YYYY
        const now = new Date();
        const diaReg = String(now.getDate()).padStart(2, '0');
        const mesReg = String(now.getMonth() + 1).padStart(2, '0');
        const anioReg = now.getFullYear();
        const fechaRegistroActual = `${diaReg}/${mesReg}/${anioReg}`;

        const newUser = {
            nombre,
            apellido,
            email: emailFinal,
            sexo,
            localidad: localidad || '',
            provincia: provincia || '',
            fechaNacimiento: fechaNacimiento || '',
            fechaRegistro: fechaRegistroActual,
            foto: base64Foto || '',
            uid: createdAuthUser.uid,
            faceDescriptor: faceDescriptor || [],
            createdAt: new Date().toISOString()
        };

        await db.collection('users').doc(createdAuthUser.uid).set(newUser);
        return res.status(201).json({ status: 'success', usuario: newUser });
        
    } catch (error) {
        console.error('Error en /register-facial:', error);
        return res.status(500).json({ status: 'error', mensaje: error.message || 'Error al procesar el registro' });
    }
});

// BIOMETRÍA CORREGIDA -> /api/users/biometria
// (Ahora usa FormData para enviar 'imageFile' binario directamente a Python, alineado con main.py)
router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', mensaje: 'No hay imagen' });
        }

        const formData = new FormData();
        formData.append('imageFile', req.file.buffer, { filename: req.file.originalname || 'biometria.jpg' });

        const pythonResponse = await axios.post(`${PYTHON_MOTOR_URL}/biometria`, formData, {
            headers: formData.getHeaders(),
            timeout: 15000 // 15 segundos de tolerancia
        });

        return res.json(pythonResponse.data);

    } catch (error) {
        console.error('Error detallado en biometría:', error.response?.data || error.message);
        const status = error.response?.status || 500;
        const mensaje = error.response?.data?.mensaje || 'Error al procesar biometría';
        return res.status(status).json({ status: 'error', mensaje });
    }
});

module.exports = router;