const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	entry: {
		main: './src/index.js',
	},
	output: {
		path: path.resolve(__dirname, 'public/'),
		publicPath: './',
		filename: './js/[name].[hash].bundle.js',
	},
	resolve: {
		extensions: ['.js', '.jsx'],
		alias: {
			utils: path.resolve(__dirname, 'src/utils'),
		},
	},
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				exclude: /(node_modules|public\/)/,
			},
			{
				test: /\.css$/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [
						{
							loader: 'css-loader',
							query: {
								modules: true,
								sourceMap: true,
								localIdentName: '[name]__[local]___[hash:base64:5]',
							},
						},
						'postcss-loader',
					],
				}),
				exclude: ['node_modules'],
			},
			{
				test: /\.scss$/,
				exclude: /node_modules/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [
						{
							loader: 'css-loader',
							query: {
								modules: true,
								sourceMap: true,
								importLoaders: 2,
								localIdentName: '[name]__[local]___[hash:base64:5]',
							},
						},
						'postcss-loader',
						'sass-loader',
					],
				}),
			},
			{
				test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
				exclude: /(node_modules|bower_components)/,
				loader: "file-loader"
			},
			{
				test: /\.(woff|woff2)$/,
				exclude: /(node_modules|bower_components)/,
				loader: "url-loader?prefix=font/&limit=5000&name=assets/fonts/[hash].[ext]"
			},
			{
				test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
				exclude: /(node_modules|bower_components)/,
				loader: "url-loader?limit=10000&mimetype=application/octet-stream&name=assets/fonts/[hash].[ext]"
			},
			{
				test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
				exclude: /(node_modules|bower_components)/,
				loader: "url-loader?limit=10000&mimetype=image/svg+xml"
			},
			{
				test: /\.gif/,
				exclude: /(node_modules|bower_components)/,
				loader: "url-loader?limit=10000&mimetype=image/gif&name=assets/images/[hash].[ext]"
			},
			{
				test: /\.jpg/,
				exclude: /(node_modules|bower_components)/,
				loader: "url-loader?limit=10000&mimetype=image/jpg&name=assets/images/[hash].[ext]"
			},
			{
				test: /\.png/,
				exclude: /(node_modules|bower_components)/,
				loader: "url-loader?limit=10000&mimetype=image/png&name=assets/images/[hash].[ext]"
			},
			{
				test: /\.ico$/,
				loader: 'file-loader?name=[name].[ext]'  // <-- retain original file name
			},
			{
				test: /\.mp3$/,
				exclude: /(node_modules|bower_components)/,
				loader: 'file-loader?name=[name].[ext]'
			},
			{
				test: /\.wav$/,
				exclude: /(node_modules|bower_components)/,
				loader: 'file-loader?name=[name].[ext]'
			},
			{
				test: /\.obj$/,
				exclude: /(node_modules|bower_components)/,
				loader: "file-loader"
			},
			{
				test: /\.mtl$/,
				exclude: /(node_modules|bower_components)/,
				loader: "file-loader"
			},
		],
	},
	plugins: [
		new ExtractTextPlugin("style.css"),
		new HtmlWebpackPlugin({
			template: './src/template.html',
			files: {
				js: ['bundle.js'],
			},
			filename: 'index.html',
		}),
		new CopyWebpackPlugin([
			{ from: 'src/assets/looop.ico' },
		]),
	],
};
