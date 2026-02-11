const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  
  // SVG transformer configuration
  config.transformer.babelTransformerPath =
    require.resolve('react-native-svg-transformer');
  config.resolver.assetExts = config.resolver.assetExts.filter(
    (ext) => ext !== 'svg'
  );
  config.resolver.sourceExts.push('svg');
  
  // Fix for duplicate react-native-maps registration
  config.resolver.blacklistRE = /node_modules\/.*\/node_modules\/react-native\/.*/;
  
  return config;
})();