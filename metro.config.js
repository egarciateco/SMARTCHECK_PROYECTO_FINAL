const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('bin', 'txt', 'jpg', 'png', 'tflite');
config.resolver.sourceExts.push('js', 'json', 'ts', 'tsx', 'jsx');

module.exports = config;