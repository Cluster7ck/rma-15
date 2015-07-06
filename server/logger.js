"use strict";
/*
 * Simple Logging Funktionen mit Farbe!
 */
var inspect = require("util").inspect;

var ansi = require("ansi");
var cursor = ansi(process.stdout);
var cursorErr = ansi(process.stderr);

var logger = module.exports = {};

function inspectArgs(args) {
    var strings = [];
    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        strings[i] = (typeof arg === "string") ? arg : inspect(arg); 
    }
    return strings.join(" ");
}

logger.http = function() {
    cursor
            .green()
            .write("HTTP")
            .reset()
            .write(" ")
            .write(inspectArgs(arguments))
            .write("\n");
};

logger.ws = function() {
    cursor
            .cyan()
            .write("WebSock")
            .reset()
            .write(" ")
            .write(inspectArgs(arguments))
            .write("\n");
};

logger.err = function() {
    cursorErr
            .brightRed()
            .write("Error")
            .reset()
            .write(" ")
            .write(inspectArgs(arguments))
            .write("\n");
};

logger.info = function() {
    cursor
            .brightBlue()
            .write("Info")
            .reset()
            .write(" ")
            .write(inspectArgs(arguments))
            .write("\n");
};