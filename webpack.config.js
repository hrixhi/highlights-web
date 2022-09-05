var webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const createExpoWebpackConfigAsync = require('@expo/webpack-config');
module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(
        {
            ...env,
            babel: {
                dangerouslyAddModulePathsToTranspile: ['nativewind'],
            },
        },
        argv
    );

    config.module.rules.push({
        test: /\.css$/i,
        use: ['postcss-loader'],
    });

    config.resolve.alias['react-native-webview'] = 'react-native-web-webview';

    config.resolve.alias['FroalaEditor'] = 'froala_editor.min.js/froala_editor.pkgd.min.js';

    config.resolve.modules = ['../node_modules/froala-editor/js', 'node_modules'];

    config.plugins.push(
        new webpack.ProvidePlugin({
            FroalaEditor: 'froala_editor.min.js/froala_editor.pkgd.min.js',
        })
    );

    return config;
};
