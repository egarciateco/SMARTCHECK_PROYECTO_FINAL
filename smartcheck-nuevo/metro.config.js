const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Decirle a Metro que estos archivos binarios NO los intente transformar como JS
config.resolver.assetExts.push('bin', 'json', 'weights', 'tflite', 'shard1');

// Bloquear la carpeta de modelos para que el bundler no entre a leerlos
config.resolver.blockList = [
  /.*\/models\/.*/, 
];

module.exports = config;