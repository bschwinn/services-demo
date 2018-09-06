const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = [
    Object.assign({}, 
        {
            entry: path.resolve("./resources/main.js"),
            output: {
                path: path.resolve('./build'),
                filename: 'main-bundle.js'
            },
            devtool: 'source-map',
            resolve: {
                extensions: ['.js']
            },
            plugins: [
                new CopyWebpackPlugin([
                    { from: './resources/*.html', flatten: true },
                    { from: './resources/*.css', flatten: true },
                    { from: './resources/apps.js', flatten: true },
                    { from: './resources/apps.json', flatten: true }
                ])
            ]
        }
    )
];
