const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;
const admin = require('firebase-admin');
const db = admin.firestore();

// Configuración de face-api para Node
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Cargar modelos (corregido para apuntar a la carpeta 'weights')
const loadModels = async () => {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('./weights');
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./weights');
    await faceapi.nets.faceRecognitionNet.loadFromDisk('./weights');
};
loadModels();

router.post('/', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', message: 'No hay imagen' });

        // 1. Procesar la imagen recibida
        const img = await canvas.loadImage(req.file.buffer);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        if (!detection) return res.status(404).json({ status: 'error', message: 'No se detectó rostro' });

        // 2. Traer todos los usuarios de Firestore
        const usersSnapshot = await db.collection('users').get();
        
        let match = null;
        let minDistance = 0.6; // Umbral de similitud

        // 3. Comparar con cada usuario
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.faceDescriptor) {
                // Convertir el array de Firestore a Float32Array (necesario para face-api)
                const storedDescriptor = new Float32Array(userData.faceDescriptor);
                const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);

                if (distance < minDistance) {
                    minDistance = distance;
                    match = { id: doc.id, ...userData };
                }
            }
        });

        if (match) {
            res.json({ status: 'success', usuario: match });
        } else {
            res.json({ status: 'error', mensaje: 'No reconocido' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', mensaje: 'Error interno' });
    }
});

module.exports = router;