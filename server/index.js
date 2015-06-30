"use strict";
var http = require("http");
var url = require("url");
var WebSocketServer = require("ws").Server;
var log = require("./logger.js");

var serverPort = 8080;

var defaultHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
};

function writeErr(res, status, msg) {
    res.writeHead(status, defaultHeaders);
    res.end("{errorMessage: \"" + msg !== undefined ? msg : http.STATUS_CODES[status] + "\"}");
}

var httpServer = http.createServer();

httpServer.on("request", function(req, res) {

    if (req.method !== "GET") {
        writeErr(res, 501);
        return;
    }

    var parsedURL = url.parse(req.url, true);
    var action = parsedURL.pathname.slice(1);
    log.http("Action: '" + action + "'");
    var actionFn = getActions[action];
    if (actionFn) {
        actionFn(req, res, parsedURL);
    } else {
        writeErr(res, 404);
    }

});

httpServer.on("clientError", function(err) {
    log.err(err);
});

httpServer.listen(serverPort);
log.info("HTTP Server running on Port " + serverPort);

var getActions = {
    "joinLobby": function(req, res, parsedURL) {
        var lobbyID = parseInt(parsedURL.query.id);
        var pw = parsedURL.query.pw;
        var name = parsedURL.query.name;

        log.http("joinLobby LobbyID: " + lobbyID);

        var lobby = lobbys[lobbyID];
        if (Number.isNaN(lobbyID) || lobby === undefined) {
            res.writeHead(404, defaultHeaders);
            res.end("{errorMessage: \"Lobby nicht gefunden\"}");
            return;
        }
        if (lobby.pw !== pw) {
            res.writeHead(401, defaultHeaders);
            res.end("{errorMessage: \"Passwort falsch\"}");
            return;
        }
        res.writeHead(200, defaultHeaders);
        res.end("{uid: 2}");
    },
    "createLobby": function(req, res, parsedURL) {
        var pw = parsedURL.query.pw;
        var name = parsedURL.query.name;

    }
};

var lobbys = {
    counter: 0,
    newLobby: function(id, pw) {
        
    },
    get: function(id) {
        return this.byId[id];
    },
    byId: Object.create(null)
};

lobbys.byId[123] = {
    pw: "pw",
    players: {
        1: {
            name: "foo"
        }
    },
    counter: 0
    
};



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
