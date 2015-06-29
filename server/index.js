var http = require('http');
var WebSocketServer = require('ws').Server;

var serverPort = 80;


var httpServer = http.createServer(function(req, res) {

    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Hello World\n");
});

httpServer.listen(serverPort, "127.0.0.1");

console.log("HTTP Server running Port: ", serverPort);



var wss = new WebSocketServer({
    server: httpServer,
    path: "/ws"

});

var wsConnection;

wss.on("connection", function connection(ws) {
    wsConnection = ws;
    console.log("ws connection");
    ws.on("message", function(message) {
        console.log("websocket received: ", message);
        ws.send(message);
    });

    //ws.send('something');
});

console.log("WebSocket Server running");

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
