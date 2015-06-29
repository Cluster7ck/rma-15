"use strict"

var ansi = require("ansi");
var cursor = ansi(process.stdout);

var logger = module.exports = {};

logger.http = function(msg) {
    cursor
            .green()
            .bg.black()
            .write("HTTP")
            .reset()
            .write(" ")
            .write(msg)
            .write("\n");
}

logger.ws = function(msg) {
    cursor
            .cyan()
            .bg.black()
            .write("WebSocket")
            .reset()
            .write(" ")
            .write(msg)
            .write("\n");
}

logger.err = function(msg) {
    cursor
            .red()
            .write("Error")
            .reset()
            .write(" ")
            .write(msg)
            .write("\n");
}

logger.info = function(msg) {
    cursor
            .blue()
            .write("Info")
            .reset()
            .write(" ")
            .write(msg)
            .reset()
            .write("\n");
}