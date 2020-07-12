var path = require('path')
var fs = require('fs-extra')
var webpack = require('webpack')
var Clean = require('clean-webpack-plugin')
var BuildPaths = require('./lib/build-paths')
var BuildExtension = require('./lib/build-extension-webpack-plugin')
var MiniCssExtractPlugin = require('mini-css-extract-plugin')

var manifestFile = fs.readJSONSync(path.join(BuildPaths.SRC_ROOT, 'manifest.json'))
var version = manifestFile.version

var entries = {
  viewer: ['./extension/src/viewer.js'],
  'viewer-alert': ['./extension/styles/viewer-alert.scss'],
  options: ['./extension/src/options.js'],
  backend: ['./extension/src/backend.js'],
  omnibox: ['./extension/src/omnibox.js'],
  'omnibox-page': ['./extension/src/omnibox-page.js']
}

function findThemes (darkness) {
  return fs.readdirSync(path.join('extension', 'themes', darkness))
    .filter(function (filename) {
      return /\.js$/.test(filename)
    })
    .map(function (theme) {
      return theme.replace(/\.js$/, '')
    })
}

function includeThemes (darkness, list) {
  list.forEach(function (filename) {
    entries[filename] = ['./extension/themes/' + darkness + '/' + filename + '.js']
  })
}

var lightThemes = findThemes('light')
var darkThemes = findThemes('dark')
var themes = { light: lightThemes, dark: darkThemes }

includeThemes('light', lightThemes)
includeThemes('dark', darkThemes)

console.log('Entries list:')
console.log(entries)
console.log('\n')

var manifest = {
  context: __dirname,
  entry: entries,
  output: {
    path: path.join(__dirname, 'build/json_viewer/assets'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        loader: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.css', '.scss'],
    modules: [
      path.resolve(__dirname, './extension'),
      path.resolve(__dirname, './node_modules')
    ]
  },
  externals: [
    {
      'chrome-framework': 'chrome'
    }
  ],
  plugins: [
    new Clean(['build']),
    new MiniCssExtractPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        VERSION: JSON.stringify(version),
        THEMES: JSON.stringify(themes)
      }
    }),
    new BuildExtension({ themes })
  ],
  optimization: {}
}

if (process.env.NODE_ENV === 'production') {
  manifest.optimization.minimize = true;
  manifest.plugins.push(new webpack.NoEmitOnErrorsPlugin());
}

module.exports = manifest
