const express = require('express');
const admin = require("firebase-admin");
const cors = require('cors');
const path = require('path');
const http = require('http');
const https = require('https'); // IMPORTADO PARA EL KEEP-ALIVE
const socketIo = require('socket.io');
const faceapi = require('face-api.js');
const canvas = require('canvas');

// --- INICIALIZACIÓN DE FIREBASE ADMIN ---
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
const server = http.createServer(app);

// Configuración de Socket.io
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});
app.set('io', io);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- REGISTRO DE RUTAS ---
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.status(200).send('Servidor SmartCheck Online - API Activa (Firebase Mode)');
});

// --- INICIALIZACIÓN DE MODELOS ---
async function startServer() {
    try {
        console.log('🔄 Inicializando servicios de Firebase y modelos...');
        
        const { Canvas, Image, ImageData } = canvas;
        faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
        
        const MODEL_PATH = path.join(__dirname, 'weights');
        console.log('🔍 Cargando modelos desde:', MODEL_PATH);
        
        // Cargamos modelos (Tiny para biometría, Ssd para registro)
        await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
        
        console.log('✅ Modelos de IA cargados correctamente');

    } catch (err) {
        console.error('❌ ADVERTENCIA: Error al cargar modelos de IA:', err);
    }

    const PORT = process.env.PORT || 10000;
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 SERVIDOR ONLINE EN EL PUERTO ${PORT}`);

        // --- INICIO DE LÓGICA KEEP-ALIVE ---
        setInterval(() => {
            https.get('https://smartcheck-proyecto-final.onrender.com', (res) => {
                console.log(`[Keep-Alive] Ping exitoso: ${res.statusCode} a las ${new Date().toLocaleTimeString()}`);
            }).on('error', (e) => {
                console.error(`[Keep-Alive] Error al hacer ping: ${e.message}`);
            });
        }, 300000); // 300,000 ms = 5 minutos
        // --- FIN DE LÓGICA KEEP-ALIVE ---
    });
    
    server.keepAliveTimeout = 120000;
    server.headersTimeout = 120000;
}

startServer();