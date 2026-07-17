const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const productsFile = path.join(__dirname, '..', 'products.json');

router.get('/', async (req, res) => {
  try {
    const { search, ean, category, supermarket, limit = 20 } = req.query;
    
    let products = [];
    
    if (fs.existsSync(productsFile)) {
      const content = fs.readFileSync(productsFile, 'utf8');
      products = JSON.parse(content);
    }
    
    if (ean) {
      products = products.filter(p => p.ean === ean);
    } else if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.brand && p.brand.toLowerCase().includes(searchLower))
      );
    }
    
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    if (supermarket) {
      products = products.filter(p => p.supermarket === supermarket);
    }
    
    products = products.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
    
  } catch (error) {
    console.error('❌ Error buscando productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar productos',
      error: error.message
    });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { name, brand, ean, price, supermarket, image, category } = req.body;
    
    if (!name || !price || !supermarket) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio y supermercado son requeridos'
      });
    }
    
    let products = [];
    if (fs.existsSync(productsFile)) {
      const content = fs.readFileSync(productsFile, 'utf8');
      products = JSON.parse(content);
    }
    
    const newProduct = {
      ean: ean || null,
      name: name,
      brand: brand || null,
      category: category || null,
      image: image || null,
      price: parseFloat(price),
      supermarket: supermarket,
      scraped_at: new Date().toISOString()
    };
    
    const existingIndex = products.findIndex(p => p.ean === ean);
    
    if (existingIndex >= 0) {
      products[existingIndex] = { ...products[existingIndex], ...newProduct };
    } else {
      products.push(newProduct);
    }
    
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');
    
    res.json({
      success: true,
      message: 'Producto agregado exitosamente',
      product: newProduct
    });
    
  } catch (error) {
    console.error('❌ Error agregando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto'
    });
  }
});

module.exports = router;