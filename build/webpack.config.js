const path = require('path');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: {
    p6: './index.js',
    app: './apps/index.js'
  },
  mode: 'development',
  devtool: 'source-map',
  cache: false,
  target: 'web',
  resolve: {
    modules: ['../node_modules', path.resolve(__dirname, '../..')]
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js'
  },
  module: {
    exprContextCritical: false,
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader',]
      }
    ]
  },
  devServer: {
    compress: true,
    publicPath: '/dist/',
    // clientLogLevel: 'none',
    // historyApiFallback: true,
    proxy: {

      // proxy all requests starting with /api to jsonplaceholder
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
};