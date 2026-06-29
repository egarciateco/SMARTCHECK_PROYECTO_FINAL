const BaseScraper = require('./baseScraper');
const { Product, Price } = require('../models/Product');
const { sequelize } = require('../config/database');

class DiaScraper extends BaseScraper {
  constructor() {
    super('Día', 'https://www.diadigital.com.ar');
    this.delay = 1500;
  }

  async scrapeProduct(url) {
    try {
      console.log(`🔍 Scrapeando producto Día: ${url}`);
      
      const response = await this.fetch(url);
      if (!response) return null;
      
      const $ = this.parseHTML(response.data);
      
      // Selectores para Día Digital (ajustar según HTML actual)
      const ean = $('meta[property="product:barcode"]').attr('content') ||
                  $('[data-ean]').attr('data-ean');
      
      const name = $('h1.product-title').text().trim() ||
                   $('.product-name').text().trim();
      
      const brand = $('.product-brand').text().trim();
      
      const priceString = $('.price-value').text().trim() ||
                          $('.current-price').text().trim();
      const price = this.parsePrice(priceString);
      
      const image = $('meta[property="og:image"]').attr('content') ||
                    $('.product-image img').attr('src');
      
      const category = $('.breadcrumb-item.active').text().trim() || 'Sin categoría';
      
      if (!name || !price) return null;
      
      return {
        ean: ean || null,
        name: name,
        brand: brand || null,
        category: category,
        image: image || null,
        price: price,
        supermarket: 'Día',
        url: url,
        in_stock: !$('.out-of-stock').length,
        scraped_at: new Date()
      };
      
    } catch (error) {
      console.error('❌ Error en scrapeProduct Día:', error);
      return null;
    }
  }

  async scrapeCategory(categoryUrl, maxProducts = 50) {
    try {
      console.log(`📦 Scrapeando categoría Día: ${categoryUrl}`);
      
      const response = await this.fetch(categoryUrl);
      if (!response) return [];
      
      const $ = this.parseHTML(response.data);
      const productUrls = [];
      
      $('.product-card a').each((i, elem) => {
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
        }
      }
      
      return products;
      
    } catch (error) {
      console.error('❌ Error en scrapeCategory Día:', error);
      return [];
    }
  }

  async saveProduct(productData) {
    // Reutilizar lógica de CotoScraper o implementar similar
    const transaction = await sequelize.transaction();
    
    let product;
    if (productData.ean) {
      [product] = await Product.findOrCreate({
        where: { ean: productData.ean },
        defaults: {
          name: productData.name,
          brand: productData.brand,
          category: productData.category,
          image: productData.image,
          normalized_name: this.normalizeName(productData.name)
        },
        transaction
      });
    } else {
      [product] = await Product.findOrCreate({
        where: { 
          normalized_name: this.normalizeName(productData.name),
          brand: productData.brand
        },
        defaults: {
          ean: null,
          name: productData.name,
          brand: productData.brand,
          category: productData.category,
          image: productData.image,
          normalized_name: this.normalizeName(productData.name)
        },
        transaction
      });
    }
    
    await Price.create({
      product_id: product.id,
      supermarket: productData.supermarket,
      price: productData.price,
      url: productData.url,
      in_stock: productData.in_stock,
      scraped_at: productData.scraped_at
    }, { transaction });
    
    await transaction.commit();
    
    return { success: true, product };
  }

  async run(categories = null) {
    const defaultCategories = [
      'https://www.diadigital.com.ar/lacteos',
      'https://www.diadigital.com.ar/almacen',
      'https://www.diadigital.com.ar/bebidas'
    ];
    
    const categoriesToScrape = categories || defaultCategories;
    const allProducts = [];
    
    for (const categoryUrl of categoriesToScrape) {
      const products = await this.scrapeCategory(categoryUrl);
      
      for (const product of products) {
        const result = await this.saveProduct(product);
        if (result.success) {
          allProducts.push(result.product);
        }
      }
    }
    
    console.log(`✅ Día: ${allProducts.length} productos procesados`);
    return allProducts;
  }
}

if (require.main === module && process.argv.includes('--run')) {
  (async () => {
    const { syncModels } = require('../config/database');
    await syncModels();
    
    const scraper = new DiaScraper();
    await scraper.run();
    process.exit(0);
  })();
}

module.exports = DiaScraper;