const createExpoWebpackConfigAsync = require('@expo/webpack-config');
module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  config.resolve.alias['react-native-webview'] = 'react-native-web-webview';
  // config.resolve.alias['react/jsx-runtime'] = 'react/jsx-runtime.js';
  // config.resolve.alias['react/jsx-dev-runtime'] = 'react/jsx-dev-runtime.js';
  return config;
};