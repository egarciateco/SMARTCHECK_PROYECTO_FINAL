const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('🔍 Interceptando APIs de Precios Claros...');
  console.log('─'.repeat(70));
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const apiCalls = [];
  
  page.on('request', request => {
    const url = request.url();
    if (
      url.includes('/api/users/') ||
      url.includes('search') ||
      url.includes('product') ||
      url.includes('query') ||
      url.includes('graphql') ||
      url.includes('precios')
    ) {
      apiCalls.push({
        method: request.method(),
        url: url,
        headers: request.headers(),
        postData: request.postData()
      });
      console.log(`📡 [${request.method()}] ${url.substring(0, 100)}`);
    }
  });
  
  console.log('\n🌐 Navegando a Precios Claros...');
  
  await page.goto('https://www.preciosclaros.gob.ar/#!/buscar-productos', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  console.log('✅ Página cargada');
  console.log('\n👉 AHORA HACÉ ESTO MANUALMENTE:');
  console.log('   1. Escribí "leche" en el buscador del sitio');
  console.log('   2. Presioná Enter o clic en buscar');
  console.log('   3. Esperá 5 segundos');
  console.log('   4. Volvé a esta terminal y presioná Enter');
  console.log('\n' + '─'.repeat(70));
  
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
  
  console.log('\n📋 APIs INTERCEPTADAS:');
  console.log('═'.repeat(70));
  
  if (apiCalls.length === 0) {
    console.log('⚠️  No se interceptaron APIs.');
  } else {
    apiCalls.forEach((call, i) => {
      console.log(`\n${i + 1}. ${call.method} ${call.url}`);
      const relevantHeaders = ['authorization', 'x-api-key', 'content-type'];
      const headersToShow = Object.entries(call.headers)
        .filter(([k]) => relevantHeaders.some(r => k.toLowerCase().includes(r)))
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
      if (Object.keys(headersToShow).length > 0) {
        console.log(`   🔑 Headers: ${JSON.stringify(headersToShow, null, 2)}`);
      }
      if (call.postData) {
        console.log(`   📦 Body: ${call.postData.substring(0, 300)}...`);
      }
    });
    
    fs.writeFileSync('precios-claros-apis.json', JSON.stringify(apiCalls, null, 2), 'utf8');
    console.log('\n💾 Guardado en: precios-claros-apis.json');
  }
  
  console.log('\n✨ Presioná Enter para cerrar...');
  await new Promise(resolve => process.stdin.once('data', resolve));
  
  await browser.close();
  process.exit(0);
})();