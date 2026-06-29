const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const baseUrl = 'https://www.coto.com.ar';
  
  console.log(`🔍 Explorando Coto: ${baseUrl}\n`);
  
  try {
    // 1. Cargar homepage
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'es-AR,es;q=0.9'
      },
      timeout: 20000
    });
    
    console.log(`✅ Homepage cargada (${response.status})\n`);
    
    const $ = cheerio.load(response.data);
    
    // 2. Buscar enlaces de categorías
    console.log('📂 Posibles categorías:');
    console.log('─'.repeat(70));
    
    const categories = new Set();
    const products = new Set();
    
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (!href || !text) return;
      
      // Completar URL relativa
      let fullUrl = href;
      if (href.startsWith('/')) {
        fullUrl = baseUrl + href;
      }
      
      // Filtrar categorías
      if (
        (href.includes('/supermercado') || 
         href.includes('/categoria') ||
         href.includes('/lacteos') ||
         href.includes('/almacen') ||
         href.includes('/bebidas') ||
         href.includes('/limpieza')) &&
        text.length > 3 && text.length < 40 &&
        !text.toLowerCase().includes('login') &&
        !text.toLowerCase().includes('carrito')
      ) {
        if (!categories.has(fullUrl)) {
          categories.add(fullUrl);
          console.log(`📁 "${text}"`);
          console.log(`   → ${fullUrl}\n`);
        }
      }
      
      // Filtrar productos individuales
      if (
        (href.match(/\/p\//) || 
         href.match(/\/\d{8,14}/) ||
         href.match(/\/producto\//)) &&
        text.length > 5
      ) {
        if (!products.has(fullUrl) && products.size < 5) {
          products.add(fullUrl);
          console.log(`📦 PRODUCTO: "${text}"`);
          console.log(`   → ${fullUrl}\n`);
        }
      }
    });
    
    console.log('─'.repeat(70));
    console.log(`📊 Categorías encontradas: ${categories.size}`);
    console.log(`📦 Productos encontrados: ${products.size}`);
    
    // 3. Guardar URLs encontradas
    if (categories.size > 0 || products.size > 0) {
      const fs = require('fs');
      const output = {
        categories: Array.from(categories),
        products: Array.from(products),
        discovered_at: new Date().toISOString()
      };
      fs.writeFileSync('coto-urls.json', JSON.stringify(output, null, 2), 'utf8');
      console.log('\n💾 URLs guardadas en: coto-urls.json');
    }
    
    // 4. Probar una URL de producto si encontramos
    if (products.size > 0) {
      const testUrl = Array.from(products)[0];
      console.log(`\n🧪 Probando producto: ${testUrl}`);
      
      try {
        const productResp = await axios.get(testUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 15000
        });
        console.log(`✅ Producto responde: ${productResp.status}`);
        
        const $p = cheerio.load(productResp.data);
        
        // Extraer datos del producto
        const name = $('h1.product-title').text().trim() || 
                     $('h1.name').text().trim() ||
                     $('[itemprop="name"]').text().trim();
        
        const price = $('.price-current').text().trim() || 
                      $('.product-price').text().trim() ||
                      $('[itemprop="price"]').attr('content');
        
        const image = $('meta[property="og:image"]').attr('content') ||
                      $('[itemprop="image"]').attr('content');
        
        console.log(`📦 Nombre: ${name || '(no encontrado)'}`);
        console.log(`💰 Precio: ${price || '(no encontrado)'}`);
        console.log(`🖼️ Imagen: ${image ? '✅' : '(no encontrado)'}`);
        
      } catch (err) {
        console.log(`❌ Error probando producto: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
    }
  }
})();