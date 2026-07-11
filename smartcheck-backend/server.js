const express = require('express');
const admin = require("firebase-admin"); 
const cors = require('cors');
const path = require('path');
const http = require('http'); // Necesario para Socket.io
const socketIo = require('socket.io'); // Necesario para la comunicación en tiempo real

const faceapi = require('face-api.js');
const canvas = require('canvas');

// Inicialización de Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore(); 

const app = express();
const server = http.createServer(app); // Creamos el servidor HTTP envolviendo a app

// Configuración de Socket.io
const io = socketIo(server, {
    cors: {
        origin: "*", // Permite conexiones de cualquier origen para el desarrollo
        methods: ["GET", "POST"]
    }
});

// Pasamos la instancia de io a la aplicación para usarla en los routes
app.set('io', io);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.status(200).send('Servidor SmartCheck Online - API Activa (Firebase Mode)');
});

async function startServer() {
    try {
        console.log('🔄 Inicializando servicios de Firebase...');
        
        console.log('✅ CONEXIÓN CONFIRMADA CON FIREBASE ADMIN');
        console.log('➡️ PROYECTO:', admin.app().options.credential.projectId);

        const { Canvas, Image, ImageData } = canvas;
        faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
        
        const MODEL_PATH = path.join(__dirname, 'weights'); 
        console.log('🔍 Cargando modelos desde:', MODEL_PATH);
        
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
        
        console.log('✅ Modelos de IA cargados correctamente');

        // Rutas
        const userRoutes = require('./routes/users');
        app.use('/api/users', userRoutes);
        
        const PORT = process.env.PORT || 10000;
        
        // --- CONFIGURACIÓN DE TIMEOUTS ---
        // Ahora escuchamos en 'server' en lugar de 'app'
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 SERVIDOR ONLINE EN EL PUERTO ${PORT}`);
        });
        
        server.keepAliveTimeout = 120000; 
        server.headersTimeout = 120000;

    } catch (err) {
        console.error('❌ ERROR CRÍTICO AL INICIAR EL SERVIDOR:');
        console.error(err);
        process.exit(1);
    }
}

startServer();