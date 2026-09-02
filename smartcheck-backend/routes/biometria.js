const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const axios = require('axios');
const FormData = require('form-data');

// Node.js actúa como puente ligero hacia el motor de Python en el puerto 8000,
// apuntando a la ruta completa '/api/users/biometria'.

router.post('/', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No hay imagen adjunta' });
        }

        console.log("📥 Imagen recibida en Node.js. Reenviando al motor de Python (/api/users/biometria)...");

        // Creamos un FormData para pasarle el archivo binario a FastAPI (Python)
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname || 'biometria.jpg',
            contentType: req.file.mimetype
        });

        // Petición al motor de Python con la ruta completa correcta
        const pythonResponse = await axios.post('http://192.168.1.7:8000/api/users/biometria', formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 20000 // 20 segundos de margen para evitar timeouts prematuros
        });

        // Respondemos a la app móvil con lo que devuelva Python
        return res.json(pythonResponse.data);

    } catch (error) {
        console.error("❌ Error al derivar biometría a Python:", error.message);

        // Si Python responde con un error específico (ej. 400, 404), reenviamos esa misma información
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }

        // Si hay un error de conexión general
        return res.status(500).json({ 
            status: 'error', 
            mensaje: 'Error de comunicación con el motor biométrico de Python',
            detalles: error.message 
        });
    }
});

module.exports = router;