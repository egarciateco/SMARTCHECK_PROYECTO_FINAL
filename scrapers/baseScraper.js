const axios = require('axios');
const cheerio = require('cheerio');

class BaseScraper {
  constructor(supermarket, baseUrl, userAgent) {
    this.supermarket = supermarket;
    this.baseUrl = baseUrl;
    this.userAgent = userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    this.delay = 1000;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetch(url, options = {}) {
    try {
      await this.sleep(this.delay);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8'
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

  parseHTML(html) {
    return cheerio.load(html);
  }

  parsePrice(priceString) {
    if (!priceString) return null;
    
    const cleaned = priceString
      .replace(/[^0-9,.\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  normalizeName(name) {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = BaseScraper;