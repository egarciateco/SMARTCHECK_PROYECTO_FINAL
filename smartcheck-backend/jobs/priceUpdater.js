const CotoScraper = require('../scrapers/cotoScraper');

class PriceUpdater {
  constructor() {
    this.scrapers = {
      coto: new CotoScraper()
    };
  }

  async updateAll() {
    console.log('🔄 Iniciando actualización de precios...');
    const startTime = Date.now();
    
    const results = {};
    
    for (const [name, scraper] of Object.entries(this.scrapers)) {
      try {
        console.log(`\n🏪 Actualizando ${name.toUpperCase()}...`);
        const products = await scraper.run();
        results[name] = {
          success: true,
          productsCount: products.length,
          timestamp: new Date()
        };
        console.log(`✅ ${name}: ${products.length} productos actualizados`);
      } catch (error) {
        console.error(`❌ Error actualizando ${name}:`, error);
        results[name] = {
          success: false,
          error: error.message,
          timestamp: new Date()
        };
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Actualización completada en ${duration} segundos`);
    
    return results;
  }
}

if (require.main === module && process.argv.includes('--run')) {
  (async () => {
    const updater = new PriceUpdater();
    await updater.updateAll();
    process.exit(0);
  })();
}

module.exports = PriceUpdater;