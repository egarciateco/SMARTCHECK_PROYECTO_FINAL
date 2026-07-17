const BaseScraper = require('./baseScraper');
const fs = require('fs');
const path = require('path');

class CotoScraper extends BaseScraper {
  constructor() {
    super('Coto', 'https://www.coto.com.ar');
    this.delay = 2000;
    this.productsFile = path.join(__dirname, '..', 'products.json');
  }

  async scrapeProduct(url) {
    try {
      console.log(`🔍 Scrapeando producto Coto: ${url}`);
      
      const response = await this.fetch(url);
      if (!response) return null;
      
      const $ = this.parseHTML(response.data);
      
      const ean = $('meta[property="product:barcode"]').attr('content') || 
                  $('.product-ean').text().trim() ||
                  url.match(/\/(\d+)\.html/)?.[1];
      
      const name = $('h1.product-title').text().trim() || 
                   $('.product-name').text().trim();
      
      const brand = $('.product-brand').text().trim() || 
                    $('meta[property="product:brand"]').attr('content');
      
      const priceString = $('.price-current').text().trim() || 
                          $('.product-price').text().trim();
      const price = this.parsePrice(priceString);
      
      const image = $('meta[property="og:image"]').attr('content') ||
                    $('.product-image img').attr('src');
      
      const category = $('.breadcrumb .active').text().trim() || 'Sin categoría';
      
      if (!name || !price) {
        console.log('⚠️ Datos incompletos, saltando producto');
        return null;
      }
      
      return {
        ean: ean || null,
        name: name,
        brand: brand || null,
        category: category,
        image: image || null,
        price: price,
        supermarket: 'Coto',
        url: url,
        scraped_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error en scrapeProduct Coto:', error);
      return null;
    }
  }

  async scrapeCategory(categoryUrl, maxProducts = 10) {
    try {
      console.log(`📦 Scrapeando categoría Coto: ${categoryUrl}`);
      
      const response = await this.fetch(categoryUrl);
      if (!response) return [];
      
      const $ = this.parseHTML(response.data);
      const productUrls = [];
      
      $('.product-item a.product-link').each((i, elem) => {
        if (productUrls.length >= maxProducts) return false;
        
        let url = $(elem).attr('href');
        if (url && !url.startsWith('http')) {
          url = this.baseUrl + url;
        }
        if (url) productUrls.push(url);
      });
      
      console.log(`🔗 Encontradas ${productUrls.length} URLs de productos`);
      
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
      console.error('❌ Error en scrapeCategory Coto:', error);
      return [];
    }
  }

  async saveProducts(products) {
    try {
      let existingProducts = [];
      
      if (fs.existsSync(this.productsFile)) {
        const content = fs.readFileSync(this.productsFile, 'utf8');
        existingProducts = JSON.parse(content);
      }
      
      for (const newProduct of products) {
        const existingIndex = existingProducts.findIndex(p => p.ean === newProduct.ean);
        
        if (existingIndex >= 0) {
          existingProducts[existingIndex] = { ...existingProducts[existingIndex], ...newProduct };
          console.log(`🔄 Actualizado: ${newProduct.name}`);
        } else {
          existingProducts.push(newProduct);
          console.log(`➕ Agregado: ${newProduct.name}`);
        }
      }
      
      fs.writeFileSync(this.productsFile, JSON.stringify(existingProducts, null, 2), 'utf8');
      console.log(`💾 Guardados ${existingProducts.length} productos en products.json`);
      
      return { success: true, count: existingProducts.length };
      
    } catch (error) {
      console.error('❌ Error guardando productos:', error);
      return { success: false, error: error.message };
    }
  }

  async run(categories = null) {
    const defaultCategories = [
      'https://www.coto.com.ar/lacteos-y-huevos',
      'https://www.coto.com.ar/almacen',
      'https://www.coto.com.ar/bebidas'
    ];
    
    const categoriesToScrape = categories || defaultCategories;
    const allProducts = [];
    
    console.log(`🚀 Iniciando scraping de Coto - ${categoriesToScrape.length} categorías`);
    
    for (const categoryUrl of categoriesToScrape) {
      const products = await this.scrapeCategory(categoryUrl, 5);
      
      const result = await this.saveProducts(products);
      if (result.success) {
        allProducts.push(...products);
      }
    }
    
    console.log(`✅ Scraping de Coto completado: ${allProducts.length} productos procesados`);
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