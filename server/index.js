"use strict"
var http = require('http');
var WebSocketServer = require('ws').Server;

var log = require("./logger.js");

var serverPort = 8080;


var httpServer = http.createServer();

httpServer.on("request", function(req, res) {

    res.writeHead(200, {"Content-Type": "application/json"});
    res.end("Hello World\n");

});

httpServer.on("clientError", function(err) {
    console.log(err);
});




httpServer.listen(serverPort, "127.0.0.1");

log.http("HTTP Server running on Port: " + serverPort);
log.ws("HTTP Server running on Port: " + serverPort);
log.err("HTTP Server running on Port: " + serverPort);
log.info("HTTP Server running on Port: " + serverPort);


//
//var wss = new WebSocketServer({
//    server: httpServer,
//    path: "/ws"
//
//});
//
//var wsConnection;
//
//wss.on("connection", function connection(ws) {
//    wsConnection = ws;
//    console.log("ws connection");
//    ws.on("message", function(message) {
//        console.log("websocket received: ", message);
//        ws.send(message);
//    });
//
//    //ws.send('something');
//});
//
//console.log("WebSocket Server running");

//
//
//var distance = function(latLng1, latLng2) {
//    // http://www.movable-type.co.uk/scripts/latlong.html
//    var φ1 = toRadians(latLng1.lat);
//    var φ2 = toRadians(latLng2.lat);
//    var Δλ = toRadians(latLng2.lng - latLng1.lng);
//    r = 6371000; // Radius der Weltkugel in m
//    // Kosinussatz bei Kugeldreieck
//    return Math.acos(Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ)) * r;
//};
//
//
//var toRadians = function(deg) {
//    return deg * Math.PI / 180;
//};
