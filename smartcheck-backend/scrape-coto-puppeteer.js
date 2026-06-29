const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class CotoDigitalPuppeteerScraper {
  constructor() {
    // ✅ URL BASE ACTUALIZADA CON LA ESTRUCTURA NUEVA
    this.baseUrl = 'https://www.cotodigital.com.ar';
    this.sitePath = '/sitios/cdigi/nuevositio';
    this.productsFile = path.join(__dirname, 'products.json');
    this.chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  parsePrice(str) {
    if (!str) return null;
    const cleaned = str.replace(/[^0-9,.\s]/g, '').replace(/\./g, '').replace(',', '.');
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  async scrapeSearch(query, maxResults = 10) {
    console.log(`🔍 Buscando en Coto Digital: ${query}`);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: this.chromePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      
      // ✅ URL DE BÚSQUEDA CON LA NUEVA ESTRUCTURA
      const searchUrl = `${this.baseUrl}${this.sitePath}/busqueda?q=${encodeURIComponent(query)}`;
      console.log(`🌐 URL: ${searchUrl}`);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });
      
      console.log('⏳ Esperando que cargue el contenido...');
      
      // Esperar a que cargue el contenido dinámico
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Debug: Mostrar el HTML para entender la estructura
      const html = await page.content();
      console.log(`📄 Página cargada: ${html.length} caracteres`);
      
      // Extraer productos desde el navegador
      const products = await page.evaluate((maxResults) => {
        const results = [];
        
        // Debug: Mostrar qué elementos encontramos
        console.log('[Browser] Buscando productos...');
        
        // Múltiples selectores comunes en e-commerce modernos
        const productSelectors = [
          '[data-testid="product-card"]',
          '.product-card',
          '.product-item',
          '[itemtype*="Product"]',
          '.product',
          '[data-component="ProductCard"]',
          '.cd-product-card',
          '[data-cy="product-card"]'
        ];
        
        let elements = [];
        for (const selector of productSelectors) {
          elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`[Browser] ✅ Encontrados ${elements.length} con: ${selector}`);
            break;
          }
        }
        
        // Fallback: buscar enlaces de productos
        if (elements.length === 0) {
          elements = document.querySelectorAll('a[href*="/productos/"], a[href*="/p/"], a[href*="/producto/"]');
          console.log(`[Browser] 🔄 Fallback: ${elements.length} enlaces de producto`);
        }
        
        elements.forEach((elem, i) => {
          if (results.length >= maxResults) return;
          
          try {
            // Extraer nombre
            let name = null;
            const nameSelectors = [
              '[itemprop="name"]',
              '.product-name',
              'h3',
              '.title',
              '[data-testid="product-name"]',
              '.name',
              '.product-title'
            ];
            for (const sel of nameSelectors) {
              const el = elem.querySelector(sel);
              if (el?.textContent?.trim() && el.textContent.trim().length > 3) {
                name = el.textContent.trim();
                break;
              }
            }
            if (!name) name = elem.textContent?.trim()?.substring(0, 100);
            
            // Extraer precio
            let priceText = null;
            const priceSelectors = [
              '[itemprop="price"]',
              '.price',
              '.price-current',
              '[data-testid="product-price"]',
              '.product-price',
              '$',
              '.price-value',
              '[data-cy="product-price"]'
            ];
            for (const sel of priceSelectors) {
              const el = elem.querySelector(sel);
              if (el?.textContent?.trim()) {
                priceText = el.textContent.trim();
                break;
              }
            }
            
            // Extraer URL
            let url = elem.href || window.location.href;
            const linkEl = elem.tagName === 'A' ? elem : elem.querySelector('a');
            if (linkEl?.href?.includes('cotodigital')) {
              url = linkEl.href;
            }
            
            if (name && name.length > 3 && priceText) {
              // Parsear precio argentino
              const priceClean = priceText.replace(/[^0-9,.\s]/g, '').replace(/\./g, '').replace(',', '.');
              const price = parseFloat(priceClean);
              
              if (!isNaN(price) && price > 0 && price < 100000) {
                results.push({
                  name: name.substring(0, 200),
                  price: price,
                  url: url,
                  supermarket: 'Coto Digital',
                  priceText: priceText.substring(0, 50)
                });
              }
            }
          } catch (e) {
            // Ignorar errores en elementos individuales
          }
        });
        
        return results;
      }, maxResults);
      
      console.log(`📦 Extraídos ${products.length} productos`);
      
      if (products.length > 0) {
        console.log('\n✅ PRODUCTOS ENCONTRADOS:');
        console.log('─'.repeat(70));
        products.forEach((p, i) => {
          console.log(`${i + 1}. ${p.name}`);
          console.log(`   💰 $${p.price} (${p.priceText})`);
          console.log(`   🔗 ${p.url}`);
          console.log('');
        });
        console.log('─'.repeat(70));
      }
      
      await browser.close();
      return products;
      
    } catch (error) {
      console.error('❌ Error con Puppeteer:', error.message);
      if (error.message.includes('Failed to launch')) {
        console.error('💡 Verificá Chrome en:', this.chromePath);
      }
      if (browser) await browser.close();
      return [];
    }
  }

  // ✅ NUEVA FUNCIÓN: Explorar la estructura del sitio
  async exploreSite() {
    console.log('🔍 Explorando estructura del sitio...');
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: this.chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Cargar la página principal nueva
      const mainUrl = `${this.baseUrl}${this.sitePath}`;
      console.log(`🌐 Cargando: ${mainUrl}`);
      
      await page.goto(mainUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Extraer información de la página
      const siteInfo = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          links: Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent?.trim()?.substring(0, 50), href: a.href }))
            .filter(l => l.href?.includes('cotodigital') && l.text?.length > 2)
            .slice(0, 30),
          productCards: document.querySelectorAll('[data-testid*="product"], .product-card, [itemtype*="Product"]').length,
          searchBox: document.querySelector('input[type="search"], input[placeholder*="buscar"], [data-testid*="search"]') ? '✅ Encontrado' : '❌ No encontrado'
        };
      });
      
      console.log('\n📋 INFORMACIÓN DEL SITIO:');
      console.log('─'.repeat(70));
      console.log(`Título: ${siteInfo.title}`);
      console.log(`URL actual: ${siteInfo.url}`);
      console.log(`Tarjetas de producto: ${siteInfo.productCards}`);
      console.log(`Buscador: ${siteInfo.searchBox}`);
      console.log('\n🔗 PRIMEROS ENLACES:');
      siteInfo.links.slice(0, 15).forEach((link, i) => {
        console.log(`${i + 1}. [${link.text}] → ${link.href}`);
      });
      console.log('─'.repeat(70));
      
      await browser.close();
      return siteInfo;
      
    } catch (error) {
      console.error('❌ Error explorando sitio:', error.message);
      if (browser) await browser.close();
      return null;
    }
  }

  async saveProducts(newProducts) {
    let existingProducts = [];
    
    if (fs.existsSync(this.productsFile)) {
      try {
        const content = fs.readFileSync(this.productsFile, 'utf8');
        existingProducts = JSON.parse(content);
      } catch (e) {
        console.error('⚠️ Error leyendo products.json');
        existingProducts = [];
      }
    }
    
    let added = 0, updated = 0;
    
    for (const newProduct of newProducts) {
      const existingIndex = existingProducts.findIndex(p => 
        (p.ean && newProduct.ean && p.ean === newProduct.ean) || 
        (p.name && newProduct.name && p.name.toLowerCase().includes(newProduct.name.toLowerCase().substring(0, 20)))
      );
      
      if (existingIndex >= 0) {
        if (existingProducts[existingIndex].price !== newProduct.price) {
          console.log(`🔄 Actualizado: ${newProduct.name} $${existingProducts[existingIndex].price} → $${newProduct.price}`);
          existingProducts[existingIndex] = { 
            ...existingProducts[existingIndex], 
            ...newProduct,
            price: newProduct.price,
            updated_at: new Date().toISOString()
          };
          updated++;
        }
      } else {
        existingProducts.push({ ...newProduct, created_at: new Date().toISOString() });
        console.log(`➕ Agregado: ${newProduct.name} - $${newProduct.price}`);
        added++;
      }
    }
    
    fs.writeFileSync(this.productsFile, JSON.stringify(existingProducts, null, 2), 'utf8');
    console.log(`💾 Guardados ${existingProducts.length} productos (+${added} nuevos, +${updated} actualizados)`);
    
    return { success: true, count: existingProducts.length, added, updated };
  }

  async run(searches = ['leche', 'arroz', 'yerba']) {
    console.log('🚀 Coto Digital Scraper - Nueva Estructura');
    console.log(`🌐 Base: ${this.baseUrl}${this.sitePath}`);
    console.log(`🔧 Chrome: ${this.chromePath}`);
    console.log('─'.repeat(70));
    
    // Primero explorar el sitio para debug
    await this.exploreSite();
    
    const allProducts = [];
    
    for (const query of searches) {
      console.log(`\n🔍 Buscando: "${query}"`);
      const products = await this.scrapeSearch(query, 5);
      
      if (products.length > 0) {
        await this.saveProducts(products);
        allProducts.push(...products);
      }
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log(`✅ COMPLETADO: ${allProducts.length} productos scrapeados`);
    console.log('═'.repeat(70));
    
    return allProducts;
  }
}

// ✅ EJECUTAR
if (require.main === module) {
  (async () => {
    try {
      require.resolve('puppeteer');
    } catch (e) {
      console.error('❌ puppeteer no instalado. Ejecutá: npm install puppeteer');
      process.exit(1);
    }
    
    if (!fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
      console.error('❌ Chrome no encontrado. Verificá la ruta.');
      process.exit(1);
    }
    
    const scraper = new CotoDigitalPuppeteerScraper();
    await scraper.run(['leche', 'arroz', 'yerba']);
    
    process.exit(0);
  })();
}

module.exports = CotoDigitalPuppeteerScraper;