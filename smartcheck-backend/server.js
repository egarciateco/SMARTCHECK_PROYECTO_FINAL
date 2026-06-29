const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const faceapi = require('face-api.js');
const canvas = require('canvas');

const app = express();

// Configuraciones iniciales y middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta base de chequeo médico de Render
app.get('/', (req, res) => {
    res.status(200).send('Servidor SmartCheck Online - API Activa');
});

// URI de MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin-smartcheck:SmartCheck2026@ac-vf18ump-shard-00-00.cejn9x9.mongodb.net:27017,ac-vf18ump-shard-00-01.cejn9x9.mongodb.net:27017,ac-vf18ump-shard-00-02.cejn9x9.mongodb.net:27017/smartcheck?replicaSet=atlas-30o117-shard-0&authSource=admin&ssl=true';

async function startServer() {
    try {
        console.log('🔄 Intentando conectar a MongoDB Atlas...');
        await mongoose.connect(MONGO_URI, { 
            dbName: 'smartcheck'
        });
        console.log('✅ CONEXIÓN CONFIRMADA EN MONGODB: smartcheck');

        // Configuración del entorno para reconocimiento facial
        faceapi.env.monkeyPatch({ 
            Canvas: canvas.Canvas, 
            Image: canvas.Image, 
            ImageData: canvas.ImageData 
        });
        console.log('✅ Entorno face-api.js inicializado correctamente');
        
        // Carga de rutas de la API
        const userRoutes = require('./routes/users');
        app.use('/api/users', userRoutes);
        
        // El puerto dinámico que Render requiere obligatoriamente
        const PORT = process.env.PORT || 3000;
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 SERVIDOR ONLINE EN EL PUERTO ${PORT}`);
        });

    } catch (err) {
        console.error('❌ ERROR CRÍTICO DURANTE EL ARRANQUE DEL SERVIDOR:');
        console.error(err);
        
        // Dejamos el servidor escuchando en el puerto asignado aunque la DB falle momentáneamente.
        // Esto evita que Render devuelva un Error 502 y te permite ver el error real en los Logs de la web.
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`⚠️ Servidor levantado en puerto ${PORT} en modo de emergencia (Sin BD)`);
        });
    }
}

startServer();