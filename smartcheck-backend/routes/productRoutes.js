const express = require('express');
const router = express.Router();
const { getProductByEan } = require('../controllers/productController');

// Ruta que consumirá tu app móvil cuando escanee un código de barras
router.get('/productos/buscar/:ean', getProductByEan);

module.exports = router;