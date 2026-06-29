const BaseScraper = require('./baseScraper');
const fs = require('fs');
const path = require('path');

class CotoScraper extends BaseScraper {
 constructor() {
  super('Coto', 'https://www.cotodigital.com.ar');  // ← Dominio correcto
  this.delay = 3000;
  this.productsFile = path.join(__dirname, '..', 'products.json');
}

  async scrapeProduct(url) {
    try {
      console.log(`🔍 Scrapeando: ${url}`);
      
      const response = await this.fetch(url);
      if (!response) return null;
      
      const $ = this.parseHTML(response.data);
      
      // Selectores actualizados para Coto
      const name = $('h1.product-title').text().trim() || 
                   $('.product-name').text().trim();
      
      const priceString = $('.price-current').text().trim() || 
                          $('.product-price').text().trim();
      const price = this.parsePrice(priceString);
      
      const image = $('meta[property="og:image"]').attr('content');
      const ean = $('meta[property="product:barcode"]').attr('content');
      
      if (!name || !price) return null;
      
      return {
        ean: ean || null,
        name: name,
        price: price,
        supermarket: 'Coto',
        image: image || null,
        url: url,
        scraped_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      return null;
    }
  }

  async scrapeCategory(categoryUrl, maxProducts = 20) {
    try {
      console.log(`📦 Scrapeando categoría: ${categoryUrl}`);
      
      const response = await this.fetch(categoryUrl);
      if (!response) return [];
      
      const $ = this.parseHTML(response.data);
      const productUrls = [];
      
      $('.product-item a, .product-card a').each((i, elem) => {
        if (productUrls.length >= maxProducts) return false;
        let url = $(elem).attr('href');
        if (url && !url.startsWith('http')) {
          url = this.baseUrl + url;
        }
        if (url) productUrls.push(url);
      });
      
      const products = [];
      for (const url of productUrls) {
        const product = await this.scrapeProduct(url);
        if (product) {
          products.push(product);
          console.log(`✅ ${product.name} - $${product.price}`);
        }
      }
      
      return products;
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      return [];
    }
  }

  async saveProducts(newProducts) {
    let existingProducts = [];
    
    if (fs.existsSync(this.productsFile)) {
      const content = fs.readFileSync(this.productsFile, 'utf8');
      existingProducts = JSON.parse(content);
    }
    
    for (const newProduct of newProducts) {
      const existingIndex = existingProducts.findIndex(p => p.ean === newProduct.ean);
      
      if (existingIndex >= 0) {
        // Actualizar precio existente
        existingProducts[existingIndex] = { 
          ...existingProducts[existingIndex], 
          ...newProduct,
          price: newProduct.price // ✅ Actualizar precio
        };
        console.log(`🔄 Actualizado: ${newProduct.name} - $${newProduct.price}`);
      } else {
        existingProducts.push(newProduct);
        console.log(`➕ Agregado: ${newProduct.name}`);
      }
    }
    
    fs.writeFileSync(this.productsFile, JSON.stringify(existingProducts, null, 2), 'utf8');
    console.log(`💾 Guardados ${existingProducts.length} productos`);
    
    return { success: true, count: existingProducts.length };
  }

  async run(categories = null) {
    // URLs reales de Coto (actualizar según el sitio actual)
    // URLs CORRECTAS de Coto Digital
const defaultCategories = [
  'https://www.cotodigital.com.ar/sitios/cdigi/productos/lacteos',
  'https://www.cotodigital.com.ar/sitios/cdigi/productos/almacen',
  'https://www.cotodigital.com.ar/sitios/cdigi/productos/bebidas',
  'https://www.cotodigital.com.ar/sitios/cdigi/productos/limpieza',
  'https://www.cotodigital.com.ar/sitios/cdigi/productos/perfumeria'
];
    
    const categoriesToScrape = categories || defaultCategories;
    const allProducts = [];
    
    for (const categoryUrl of categoriesToScrape) {
      const products = await this.scrapeCategory(categoryUrl, 10);
      if (products.length > 0) {
        await this.saveProducts(products);
        allProducts.push(...products);
      }
    }
    
    console.log(`✅ Coto: ${allProducts.length} productos scrapeados`);
    return allProducts;
  }
}

if (require.main === module && process.argv.includes('--run')) {
  (async () => {
    const scraper = new CotoScraper();
    await scraper.run();
    process.exit(0);
  })();
}

module.exports = CotoScraper;