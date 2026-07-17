export const debugLog = (tag, data, level = 'info') => {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [${level.toUpperCase()}] [${tag}]`;
  
  if (level === 'error') {
    console.error(message, data);
  } else if (level === 'warn') {
    console.warn(message, data);
  } else {
    console.log(message, JSON.stringify(data, null, 2));
  }
  
  // Opcional: enviar a servicio de monitoreo
  // analytics.logEvent(tag, { level, data, timestamp });
};