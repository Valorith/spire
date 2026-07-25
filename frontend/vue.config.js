const path = require("path");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = {
  // Keep ESLint as an explicit developer check. This legacy Vue CLI 3 app has
  // existing lint debt that should not unexpectedly block serve/build.
  lintOnSave: false,
  devServer: {
    host: "0.0.0.0",
    disableHostCheck: true,
    // Direct entry to Vue Router pages (notably /sage) must work after a
    // freshly started local dev server, not only after navigating from `/`.
    historyApiFallback: true,
    watchOptions: {
      ignored: [/node_modules/, /public/],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3010",
        changeOrigin: true,
      },
      "/eq-asset-preview-master": {
        target: "http://127.0.0.1:3010",
        changeOrigin: true,
      },
    },
  },
  // configureWebpack: {
  //   plugins: [
  //     new BundleAnalyzerPlugin({analyzerHost: '0.0.0.0', analyzerPort: 3005})
  //   ]
  // },
  chainWebpack: (config) => {
    config.performance.maxEntrypointSize(40000000).maxAssetSize(40000000);

    // ignore asset preview during development to keep build times down
    if (process.env.NODE_ENV !== "production") {
      config.plugin("copy").tap(([options]) => {
        options[0].ignore.push("eq-asset-preview-master/**/*");

        return [options];
      });
    }
    //
    config.output
      .filename("[name].[hash].js")
      .path(path.resolve(__dirname, "dist"))
      .clean(true);

    config.plugins.delete('prefetch')

    //
    // config.optimization.moduleIds    = 'deterministic'
    // config.optimization.runtimeChunk = 'single'
    config.optimization.splitChunks = {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    };
    // console.log(config)
  },
  runtimeCompiler: true,
  productionSourceMap: false,
};
