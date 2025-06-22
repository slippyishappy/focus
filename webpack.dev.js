const path = require('path');
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    mode: "development",
    devtool: "cheap-module-source-map", // Chrome extension compatible
    devServer: {
        watchFiles: ["./src/popup.html"],
        static: {
            directory: path.join(__dirname, 'public'),
        },
    },
});
