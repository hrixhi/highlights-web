var webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const createExpoWebpackConfigAsync = require('@expo/webpack-config');
module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(env, argv);

    // if (env.mode === 'development') {
    //     config.plugins.push(new ReactRefreshWebpackPlugin());
    // }

    // config.module.rules.push({
    //     test: /\.jsx$/,
    //     use: {
    //         loader: 'babel-loader',
    //         options: {
    //             cacheDirectory: true,
    //             presets: ['react', 'es2015', 'stage-2']
    //         }
    //     }
    // });

    // config.module.rules.push({
    //     test: /\.css$/,
    //     use: ['style-loader', 'css-loader']
    // });

    // config.module.rules.push({
    //     test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
    //     use: 'url-loader?limit=10000&mimetype=application/font-woff'
    // });

    // config.module.rules.push({
    //     test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
    //     use: 'url-loader?limit=10000&mimetype=application/font-woff'
    // });

    // config.module.rules.push({
    //     test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
    //     use: 'url-loader?limit=10000&mimetype=application/octet-stream'
    // });
    // config.module.rules.push({
    //     test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
    //     use: 'file-loader'
    // });
    // config.module.rules.push({
    //     test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
    //     use: 'url-loader?limit=10000&mimetype=image/svg+xml'
    // });

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
