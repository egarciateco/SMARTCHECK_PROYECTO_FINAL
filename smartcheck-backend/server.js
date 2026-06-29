const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const faceapi = require('face-api.js');
const canvas = require('canvas');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.status(200).send('Servidor SmartCheck Online - API Activa');
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin-smartcheck:SmartCheck2026@ac-vf18ump-shard-00-00.cejn9x9.mongodb.net:27017,ac-vf18ump-shard-00-01.cejn9x9.mongodb.net:27017,ac-vf18ump-shard-00-02.cejn9x9.mongodb.net:27017/smartcheck?replicaSet=atlas-30o117-shard-0&authSource=admin&ssl=true';

async function startServer() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: 'smartcheck' });
        console.log('✅ CONEXIÓN CONFIRMADA EN: smartcheck');

        faceapi.env.monkeyPatch({ Canvas: canvas.Canvas, Image: canvas.Image, ImageData: canvas.ImageData });
        
        const userRoutes = require('./routes/users');
        app.use('/api/users', userRoutes);
        
        // Render inyecta el puerto automáticamente
        const PORT = process.env.PORT || 3000;
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 SERVIDOR ONLINE EN EL PUERTO ${PORT}`);
        });
    } catch (err) {
        process.exit(1);
    }
}

startServer();