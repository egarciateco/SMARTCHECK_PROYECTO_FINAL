const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const baseUrl = 'https://www.coto.com.ar';
  
  console.log(`🔍 Explorando: ${baseUrl}\n`);
  
  try {
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'es-AR,es;q=0.9'
      },
      timeout: 20000
    });
    
    console.log(`✅ Homepage cargada (${response.status})\n`);
    
    const $ = cheerio.load(response.data);
    
    // Buscar enlaces que parezcan categorías
    console.log('📂 Posibles categorías encontradas:');
    console.log('─'.repeat(60));
    
    const categories = new Set();
    
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (!href || !text) return;
      
      // Filtrar enlaces que parezcan categorías de productos
      if (
        (href.includes('/supermercado') || 
         href.includes('/categoria') || 
         href.includes('/lacteos') ||
         href.includes('/almacen') ||
         href.includes('/bebidas')) &&
        text.length > 2 && text.length < 50
      ) {
        let fullUrl = href;
        if (href.startsWith('/')) {
          fullUrl = baseUrl + href;
        }
        
        if (!categories.has(fullUrl)) {
          categories.add(fullUrl);
          console.log(`  "${text}"`);
          console.log(`  → ${fullUrl}\n`);
        }
      }
    });
    
    console.log('─'.repeat(60));
    console.log(`📊 Total de categorías encontradas: ${categories.size}`);
    
    // Guardar URLs encontradas en un archivo
    if (categories.size > 0) {
      const fs = require('fs');
      const urls = Array.from(categories);
      fs.writeFileSync('coto-categories.json', JSON.stringify(urls, null, 2), 'utf8');
      console.log('\n💾 URLs guardadas en: coto-categories.json');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
    }
  }
})();