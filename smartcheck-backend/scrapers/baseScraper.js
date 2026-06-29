const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

class BaseScraper {
  constructor(supermarket, baseUrl, userAgent) {
    this.supermarket = supermarket;
    this.baseUrl = baseUrl;
    this.userAgent = userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    this.delay = 1000; // 1 segundo entre requests
  }

  // Delay para evitar rate limiting
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Request con headers y manejo de errores
  async fetch(url, options = {}) {
    try {
      await this.sleep(this.delay);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
          ...options.headers
        },
        timeout: 30000,
        ...options
      });
      
      console.log(`✅ ${this.supermarket}: ${url} - ${response.status}`);
      return response;
    } catch (error) {
      console.error(`❌ ${this.supermarket}: Error en ${url}:`, error.message);
      return null;
    }
  }

  // Parsear HTML con Cheerio
  parseHTML(html) {
    return cheerio.load(html);
  }

  // Extraer precio de string (maneja formatos argentinos)
  parsePrice(priceString) {
    if (!priceString) return null;
    
    // Remover símbolos y formato argentino: $1.234,56 → 1234.56
    const cleaned = priceString
      .replace(/[^0-9,.\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  // Normalizar nombre para matching
  normalizeName(name) {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s]/g, '') // Remover símbolos
      .replace(/\s+/g, ' ') // Espacios múltiples → uno
      .trim();
  }

  // Scrapear página con Puppeteer (para sitios con JS)
  async scrapeWithPuppeteer(url, selector) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent(this.userAgent);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Esperar que cargue el contenido
      await page.waitForSelector(selector, { timeout: 10000 });
      
      const content = await page.content();
      await browser.close();
      
      return content;
    } catch (error) {
      console.error(`❌ Puppeteer error:`, error.message);
      if (browser) await browser.close();
      return null;
    }
  }

  // Método abstracto - debe ser implementado por subclasses
  async scrapeProduct(url) {
    throw new Error('scrapeProduct() debe ser implementado');
  }

  async scrapeCategory(categoryUrl) {
    throw new Error('scrapeCategory() debe ser implementado');
  }
}

module.exports = BaseScraper;