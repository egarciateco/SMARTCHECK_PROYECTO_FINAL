const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const helmet = require('helmet'); 
const morgan = require('morgan');

dotenv.config();

const app = express();

// 1. Seguridades
app.use(helmet()); 
app.use(morgan('dev')); 

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Firebase
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require('./serviceAccountKey.json');
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase inicializado correctamente");
} catch (error) {
  console.error("❌ ERROR AL INICIALIZAR FIREBASE:", error);
  process.exit(1); 
}

// 4. Rutas
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

app.get('/', (req, res) => {
  res.status(200).send("🚀 Servidor SMARTCHECK Backend Online");
});

app.use((err, req, res, next) => {
  console.error("🔥 Error no controlado:", err.stack);
  res.status(500).json({ status: 'error', mensaje: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});