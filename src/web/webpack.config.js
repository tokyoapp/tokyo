const webpack = require("webpack");
const path = require("path");
const package = require("./package.json");

const banner = package.name + " - " + package.version;

module.exports = {
  target: "web",
  mode: process.env.NODE_ENV || "development",
  entry: "./src/main.ts",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true, // TODO: remove this and fix errors
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css|\.s(c|a)ss$/,
        use: [
          {
            loader: "lit-scss-loader",
            options: {
              minify: true,
            },
          },
          "extract-loader",
          "css-loader",
          "sass-loader",
        ],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "public"),
  },
  plugins: [new webpack.BannerPlugin(banner)],
};
