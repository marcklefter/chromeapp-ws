var path = require('path');

// ...

module.exports = {
    entry: path.join(__dirname, 'src/background.js'),
    output: {
        path: path.join(__dirname, 'dist/build'),
        filename: 'bundle.js'
    },
    devtool: 'inline-source-map',
    module: {
        loaders: [
            {
                loader: 'babel',
                test: path.join(__dirname, 'src'),
                query: {
                    presets: ['es2015']
                }
            }
        ]
    }
};