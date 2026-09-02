const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('🔍 Interceptando requests de Coto Digital...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  // ✅ INTERCEPTAR REQUESTS DE RED
  const apiRequests = [];
  
  page.on('request', request => {
    const url = request.url();
    
    // Filtrar requests que parezcan APIs de productos
    if (
      url.includes('/api/users/') ||
      url.includes('/graphql') ||
      url.includes('product') ||
      url.includes('search') ||
      url.includes('query')
    ) {
      apiRequests.push({
        method: request.method(),
        url: url,
        headers: request.headers(),
        postData: request.postData()
      });
      console.log(`📡 [${request.method()}] ${url}`);
    }
  });
  
  // Navegar a búsqueda
  const searchUrl = 'https://www.cotodigital.com.ar/sitios/cdigi/nuevositio/busqueda?q=leche';
  console.log(`🌐 Navegando: ${searchUrl}`);
  
  await page.goto(searchUrl, { 
    waitUntil: 'networkidle2',
    timeout: 60000 
  });
  
  // Esperar más para que carguen las APIs
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  // Mostrar resultados
  console.log('\n📋 REQUESTS DE API ENCONTRADOS:');
  console.log('─'.repeat(80));
  
  apiRequests.forEach((req, i) => {
    console.log(`\n${i + 1}. ${req.method} ${req.url}`);
    if (req.headers) {
      console.log(`   Headers: ${JSON.stringify(req.headers).substring(0, 200)}...`);
    }
    if (req.postData) {
      console.log(`   Body: ${req.postData.substring(0, 200)}...`);
    }
  });
  
  // Guardar para análisis
  if (apiRequests.length > 0) {
    fs.writeFileSync('coto-api-requests.json', JSON.stringify(apiRequests, null, 2), 'utf8');
    console.log(`\n💾 Guardados ${apiRequests.length} requests en coto-api-requests.json`);
  }
  
  // Intentar extraer productos del estado de la página
  console.log('\n🔍 Intentando extraer productos del estado global...');
  
  try {
    const products = await page.evaluate(() => {
      // Buscar en window.__PRELOADED_STATE__ o similar
      const stateKeys = Object.keys(window).filter(k => 
        k.includes('state') || k.includes('store') || k.includes('data') || k.includes('INITIAL')
      );
      
      const results = [];
      
      for (const key of stateKeys) {
        try {
          const data = window[key];
          if (data && typeof data === 'object') {
            // Buscar arrays que parezcan productos
            const findProducts = (obj, path = '') => {
              if (Array.isArray(obj) && obj.length > 0 && obj[0]?.name) {
                results.push({ source: path, products: obj.slice(0, 5) });
              }
              if (typeof obj === 'object' && obj !== null) {
                Object.entries(obj).forEach(([k, v]) => {
                  if (k.toLowerCase().includes('product')) {
                    findProducts(v, `${path}.${k}`);
                  }
                });
              }
            };
            findProducts(data, key);
          }
        } catch (e) {}
      }
      
      return results;
    });
    
    if (products.length > 0) {
      console.log('✅ Productos encontrados en estado global:');
      products.forEach(p => {
        console.log(`\n📦 Fuente: ${p.source}`);
        p.products.forEach(prod => {
          console.log(`   - ${prod.name} - $${prod.price || prod.precio || 'N/A'}`);
        });
      });
    } else {
      console.log('⚠️ No se encontraron productos en el estado global');
    }
  } catch (e) {
    console.log('❌ Error extrayendo estado:', e.message);
  }
  
  await browser.close();
  console.log('\n✨ Debug completado');
  process.exit(0);
})();