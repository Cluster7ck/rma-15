"use strict";
var http = require("http");
var url = require("url");
var WebSocketServer = require("ws").Server;

var log = require("./logger.js");

var serverPort = 8080;

var httpServer = http.createServer();

httpServer.on("request", function(req, res) {
    
    var headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    };
    
    var parsedURL = url.parse(req.url, true);
    var action = parsedURL.pathname.slice(1);
    if (action == "joinLobby") {
        
        var lobbyID = parseInt(parsedURL.query.id);
        var pw = parsedURL.query.pw;
        var name = parsedURL.query.name;
        
        log.http("joinLobby LobbyID: " + lobbyID);
        
        var lobby = lobbys[lobbyID];
        if(Number.isNaN(lobbyID) || lobby === undefined) {
            res.writeHead(404, headers);
            res.end("{error: \"Lobby nicht gefunden\"}");
            return;
        }
        if(lobby.pw !== pw) {
            res.writeHead(401, headers);
            res.end("{error: \"Passwort falsch\"}");
            return;
        }
        res.writeHead(200, headers);
        res.end("{uid: 2}");
        return;
        
    } else if (action == "createLobby") {
        
    }

    res.writeHead(404, headers);
    res.end("unbekannte action");

});

httpServer.on("clientError", function(err) {
    log.err(err);
});


httpServer.listen(serverPort);

var lobbys = Object.create(null);

lobbys[123] = {
    pw: "pw",
    players: {
        1: {
            name: "foo"
        }
    }
}






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
