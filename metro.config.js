const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add additional configurations for expo-router
config.resolver.assetExts.push('cjs');

// Remove the custom transformer line
// config.transformer.babelTransformerPath = require.resolve('react-native-babel-transformer');

module.exports = config;
