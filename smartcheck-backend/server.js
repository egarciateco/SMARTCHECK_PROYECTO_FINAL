const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const faceapi = require('face-api.js');
const canvas = require('canvas');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.status(200).send('Servidor SmartCheck Online - API Activa');
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin-smartcheck:SmartCheck2026@ac-vf18ump-shard-00-00.cejn9x9.mongodb.net:27017,ac-vf18ump-shard-00-01.cejn9x9.mongodb.net:27017,ac-vf18ump-shard-00-02.cejn9x9.mongodb.net:27017/smartcheck?replicaSet=atlas-30o117-shard-0&authSource=admin&ssl=true';

async function startServer() {
    try {
        console.log('🔄 Intentando conectar a MongoDB Atlas...');
        await mongoose.connect(MONGO_URI, { dbName: 'smartcheck' });
        console.log('✅ CONEXIÓN CONFIRMADA EN MONGODB');

        // Configuración entorno facial
        const { Canvas, Image, ImageData } = canvas;
        faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
        
        // --- INYECCIÓN DE CARGA DE MODELOS ---
        const MODEL_PATH = path.join(__dirname, 'models'); 
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
        console.log('✅ Modelos de IA cargados correctamente');
        // ------------------------------------

        const userRoutes = require('./routes/users');
        app.use('/api/users', userRoutes);
        
        const PORT = process.env.PORT || 10000;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 SERVIDOR ONLINE EN EL PUERTO ${PORT}`);
        });

    } catch (err) {
        console.error('❌ ERROR CRÍTICO:', err);
        process.exit(1);
    }
}

startServer();