/**
 * Created by andrey on 26.02.16.
 */
var webpack = require("webpack");
var rootJsDir = __dirname + "/src";
module.exports = {
    context: rootJsDir,
    entry: "./te.repeat.js",
    output: {
        path: __dirname + '/public',
        filename: "te.repeat.js"
    },
    plugins: [new webpack.optimize.UglifyJsPlugin()]
};
