module.exports = function (api) {
    // api.cache.using(() => process.env.NODE_ENV);
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: ['react-native-reanimated/plugin', 'nativewind/babel'],
    };
};
