const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class CotoDigitalScraper {
  constructor() {
    this.baseUrl = 'https://www.cotodigital.com.ar';
    this.delay = 3000;
    this.productsFile = path.join(__dirname, 'products.json');
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetch(url) {
    try {
      await this.sleep(this.delay);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'es-AR,es;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000,
        maxRedirects: 5
      });
      console.log(`✅ Coto Digital: ${response.status}`);
      return response;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      return null;
    }
  }

  parsePrice(str) {
    if (!str) return null;
    const cleaned = str.replace(/[^0-9,.\s]/g, '').replace(/\./g, '').replace(',', '.');
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  async scrapeSearch(query, maxResults = 10) {
    try {
      // URL de búsqueda de Coto Digital
      const searchUrl = `${this.baseUrl}/sitios/cdigi/busqueda?q=${encodeURIComponent(query)}`;
      console.log(`🔍 Buscando en Coto Digital: ${query}`);
      console.log(`URL: ${searchUrl}\n`);
      
      const response = await this.fetch(searchUrl);
      if (!response) return [];
      
      const $ = cheerio.load(response.data);
      const products = [];
      
      // Buscar productos en la página de resultados
      // Selectores comunes en e-commerce
      $('a[href*="/productos/"]').each((i, elem) => {
        if (products.length >= maxResults) return false;
        
        const href = $(elem).attr('href');
        const name = $(elem).find('.product-name, [itemprop="name"], h3, .title').text().trim();
        const priceText = $(elem).find('.price, [itemprop="price"], .price-current, .product-price').text().trim();
        const price = this.parsePrice(priceText);
        
        if (name && price) {
          let fullUrl = href;
          if (href.startsWith('/')) {
            fullUrl = this.baseUrl + href;
          }
          
          products.push({
            name: name,
            price: price,
            url: fullUrl,
            supermarket: 'Coto Digital'
          });
          
          console.log(`✅ ${name} - $${price}`);
        }
      });
      
      console.log(`\n📦 Encontrados ${products.length} productos`);
      return products;
      
    } catch (error) {
      console.error('❌ Error en búsqueda:', error.message);
      return [];
    }
  }

  async scrapeProduct(url) {
    try {
      console.log(`🔍 Scrapeando producto: ${url}`);
      
      const response = await this.fetch(url);
      if (!response) return null;
      
      const $ = cheerio.load(response.data);
      
      const product = {
        name: $('h1.product-title, h1.name, [itemprop="name"]').text().trim(),
        brand: $('[itemprop="brand"], .product-brand').text().trim(),
        price: this.parsePrice($('.price-current, [itemprop="price"], .product-price').text().trim()),
        image: $('meta[property="og:image"]').attr('content') || $('[itemprop="image"]').attr('content'),
        ean: $('meta[property="product:barcode"]').attr('content') || $('[itemprop="gtin13"]').attr('content'),
        supermarket: 'Coto Digital',
        url: url,
        scraped_at: new Date().toISOString()
      };
      
      if (product.name && product.price) {
        console.log(`✅ ${product.name} - $${product.price}`);
        return product;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error scrapeando producto:', error.message);
      return null;
    }
  }

  async saveProducts(newProducts) {
    let existingProducts = [];
    
    if (fs.existsSync(this.productsFile)) {
      const content = fs.readFileSync(this.productsFile, 'utf8');
      existingProducts = JSON.parse(content);
    }
    
    for (const newProduct of newProducts) {
      const existingIndex = existingProducts.findIndex(p => p.ean === newProduct.ean || p.name === newProduct.name);
      
      if (existingIndex >= 0) {
        existingProducts[existingIndex] = { ...existingProducts[existingIndex], ...newProduct };
        console.log(`🔄 Actualizado: ${newProduct.name}`);
      } else {
        existingProducts.push(newProduct);
        console.log(`➕ Agregado: ${newProduct.name}`);
      }
    }
    
    fs.writeFileSync(this.productsFile, JSON.stringify(existingProducts, null, 2), 'utf8');
    console.log(`💾 Guardados ${existingProducts.length} productos totales`);
    
    return { success: true, count: existingProducts.length };
  }

  async run(searches = ['leche', 'arroz', 'yerba']) {
    const allProducts = [];
    
    for (const query of searches) {
      const products = await this.scrapeSearch(query, 5);
      if (products.length > 0) {
        await this.saveProducts(products);
        allProducts.push(...products);
      }
    }
    
    console.log(`\n✅ Coto Digital completado: ${allProducts.length} productos scrapeados`);
    return allProducts;
  }
}

// Ejecutar
if (require.main === module) {
  (async () => {
    const scraper = new CotoDigitalScraper();
    await scraper.run();
    process.exit(0);
  })();
}

module.exports = CotoDigitalScraper;