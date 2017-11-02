const webpack = require('webpack');
const config = require('./config.json');

const NODE_ENV = process.env.NODE_ENV || 'development'; // production|development

let plugins = [
    new webpack.DefinePlugin({
        'process.env': {
            'NODE_ENV': JSON.stringify(NODE_ENV)
        }
    })
];

if (NODE_ENV == 'production') {
    plugins.push(
        new webpack.optimize.UglifyJsPlugin({minimize: true})
    );
}

module.exports = {
    watch: NODE_ENV == 'development',
    entry: {
        'timetracker' : './jsx/timetracker/index.js',
        'polyfill'    : './jsx/babel-polyfill.js'
    },
    output: {
        path: __dirname,
        filename: 'js/[name].js'
    },
    plugins: plugins,
    module: {
        loaders: [
            {
                test: /\.js|\.jsx$/,
                loader: "babel-loader",
                exclude: [/node_modules/],
                query: {
                    presets: ['es2015', 'react']
                }
            },
            {
                test: /\.json$/,
                loader: "json-loader"
            },
            {
                test: /\.css$/,
                loader: [ 'style-loader', 'css-loader' ]
            }
        ]
    }
}
