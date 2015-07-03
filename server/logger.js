"use strict";
/*
 * Simple Logging Funktionen mit Farbe!
 */
var inspect = require("util").inspect;

var ansi = require("ansi");
var cursor = ansi(process.stdout);
var cursorErr = ansi(process.stderr);

var logger = module.exports = {};

function formatMsg(msg) {
    return (typeof msg === "string") ? msg : inspect(msg);
}

logger.http = function(msg) {
    cursor
            .green()
            .write("HTTP")
            .reset()
            .write(" ")
            .write(formatMsg(msg))
            .write("\n");
};

logger.ws = function(msg) {
    cursor
            .cyan()
            .write("WebSock")
            .reset()
            .write(" ")
            .write(formatMsg(msg))
            .write("\n");
};

logger.err = function(msg) {
    cursorErr
            .brightRed()
            .write("Error")
            .reset()
            .write(" ")
            .write(formatMsg(msg))
            .write("\n");
};

logger.info = function(msg) {
    cursor
            .brightBlue()
            .write("Info")
            .reset()
            .write(" ")
            .write(formatMsg(msg))
            .write("\n");
};