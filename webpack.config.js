const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const {defaultRuntimeVersion} = require('./utils');

function prepConfig(config) {
    const newConf = Object.assign({}, config);
    if (typeof process.env.RUNTIME_VERSION != 'undefined' && process.env.RUNTIME_VERSION != "" ) {
        newConf.runtime.version = process.env.RUNTIME_VERSION;
    } else {
        newConf.runtime.version = defaultRuntimeVersion;
    }
    return newConf;
}

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
                    { from: './resources/apps.js', flatten: true }
                ]),
                new CopyWebpackPlugin([
                    { from: './resources/apps.json', to: 'apps.json', transform: (content) => {
                        const config = JSON.parse(content);
                        const newConfig = prepConfig(config);
                        return JSON.stringify(newConfig, null, 4);
                    }}
                ])
            ]
        }
    )
];
