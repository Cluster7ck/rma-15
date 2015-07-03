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

var ERROR_CODES = {
    SERVER_FULL: 1,
    LOBBY_FULL: 2,
    LOBBY_NOT_FOUND: 3,
    INCORRECT_PW: 4,
    INVALID_NAME: 5,
    INVALID_PW: 6
};
var ERROR_MSG = {
    1: "Server voll",
    2: "Lobby voll",
    3: "Lobby nicht gefunden",
    4: "Passwort falsch",
    5: "Ungültiger Username",
    6: "Ungültiges Passwort"
};

// HTTP Anfrage mit Fehler beenden
function writeErr(res, status, errCode) {
    var msg = errCode ? ERROR_MSG[errCode] : http.STATUS_CODES[status];
    log.http("Error: " + status + " " + msg);
    res.writeHead(status, defaultHeaders);
    res.end(JSON.stringify({
        errorCode: errCode,
        errorMsg: msg
    }));
}
// HTTP Anfrage erfolgreich mit JSON beenden
function writeEnd(res, jsonObj) {
    res.writeHead(200, defaultHeaders);
    res.end(JSON.stringify(jsonObj));
}

var httpServer = http.createServer();

httpServer.on("request", function(req, res) {
    // Unbekannte Methode -> 501 Not Implemented
    if (req.method !== "GET") {
        writeErr(res, 501);
        return;
    }
    // Passenden Action suchen
    var parsedURL = url.parse(req.url, true);
    var action = parsedURL.pathname.slice(1);
    log.http("Action: '" + action + "'");
    var actionFn = getActions[action];
    if (actionFn) {
        actionFn(req, res, parsedURL.query);
    } else {
        // Unbekannte Aktion -> 404
        writeErr(res, 404);
    }

});

httpServer.on("clientError", function(err) {
    log.err(err);
});

var getActions = {
    "joinLobby": function(req, res, query) {

        var lobby = lobbys.getLobby(query.lid);
        if (lobby === undefined) {
            // Not Found
            writeErr(res, 404, ERROR_CODES.LOBBY_NOT_FOUND);
            return;
        }
        if (!validate.isValidName(query.name)) {
            // 422 Unprocessable Entity
            writeErr(res, 422, ERROR_CODES.INVALID_NAME);
            return;
        }
        if (lobby.pw !== query.pw) {
            // 401 Unauthorized
            writeErr(res, 401, ERROR_CODES.INCORRECT_PW);
            return;
        }
        if (lobby.isFull()) {
            // 503 Service Unavailable
            writeErr(res, 503, ERROR_CODES.LOBBY_FULL);
            return;
        }
        // New Pending Player
        var newPlayer = lobby.addPlayer(query.name);
        // Mit pid und allen anderen Spielern als Array antworten
        writeEnd(res, {
            pid: newPlayer.pid,
            playerCollection: lobby.getPlayersArray(newPlayer.pid)
        });
    },
    "createLobby": function(req, res, query) {
        var pw = query.pw;
        var name = query.name;

        if (!validate.isValidPw(pw)) {
            // 422 Unprocessable Entity
            writeErr(res, 422, ERROR_CODES.INVALID_PW);
            return;
        }
        if (!validate.isValidName(name)) {
            // 422 Unprocessable Entity
            writeErr(res, 422, ERROR_CODES.INVALID_NAME);
            return;
        }
        if (lobbys.isFull()) {
            // 503 Service Unavailable
            writeErr(res, 503, ERROR_CODES.SERVER_FULL);
            return;
        }
        // new Pending Lobby, mit Admin
        var newLobby = lobbys.addLobby(pw, name);
        // Mit lid und pid antworten
        writeEnd(res, {
            lid: newLobby.lid,
            pid: newLobby.admin.pid
        });
    }
};

var validate = {
    parseId: function(id) {
        id = Number.parseInt(id);
        return id >= 0 ? id : NaN;
    },
    parseJSON: function(str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    },
    isValidPw: function(pw) {
        if (typeof pw === "string" && pw.length > 0) {
            return true;
        }
        return false;
    },
    isValidName: function(name) {
        if (typeof name === "string" && name.length > 0) {
            return true;
        }
        return false;
    }
};

var lobbyPrototype = {
    isFull: function() {
        if (this.playerMap.size >= this.max) {
            return true;
        }
        return false;
    },
    addPlayer: function(name) {
        var newPlayer = {
            pid: this.playerCounter++,
            name: name,
            group: 1
        };
        this.playerMapPending.set(newPlayer.pid, newPlayer);
        log.http("New pending player in lobby " + this.lid);
        // Remove Pending Player after Timeout
        this.pendingTimer = setTimeout(function() {
            this.playerMapPending.delete(newPlayer.pid);
            log.http("Pending Player removed from Lobby " + this.lid);
        }.bind(this), 5000);
        return newPlayer;
    },
    removePlayer: function(pid) {
        this.playerMap.delete(pid);
    },
    getPendingPlayer: function(pid) {
        return this.playerMapPending.get(validate.parseId(pid));
    },
    verifyPlayer: function(pPlayer) {
        clearTimeout(this.pendingTimer);
        this.playerMap.set(pPlayer.pid, pPlayer);
        this.playerMapPending.delete(pPlayer.pid);
        log.ws("Verified player in Lobby " + this.lid);
        return pPlayer;
    },
    getPlayersArray: function(filterPid) {
        var players = [];
        this.playerMap.forEach(function(player) {
            if (filterPid && player.pid !== filterPid) {
                players.push({
                    pid: player.pid,
                    name: player.name,
                    group: player.group,
                    isMrx: this.mrx === player,
                    isAdmin: this.admin === player
                });
            }
        });
        return players;
    }
};


var lobbys = {
    lobbyMap: new Map(),
    lobbyMapPending: new Map(),
    lobbyCounter: 0,
    max: 1000,
    isFull: function() {
        if (this.lobbyMap.size >= this.max) {
            return true;
        }
        return false;
    },
    addLobby: function(pw, adminName) {
        var newLobby = Object.create(lobbyPrototype);
        newLobby.lid = this.lobbyCounter++;
        newLobby.pw = pw;
        newLobby.playerMap = new Map();
        newLobby.playerMapPending = new Map();
        newLobby.playerCounter = 0;
        newLobby.max = 100;
        var newPlayer = newLobby.addPlayer(adminName);

        newLobby.mrx = newPlayer;
        newLobby.admin = newPlayer;
        this.lobbyMapPending.set(newLobby.lid, newLobby);
        log.http("New pending lobby " + newLobby.lid);
        // Timeout
        this.pendingTimer = setTimeout(function() {
            this.lobbyMapPending.delete(newLobby.lid);
            log.http("Pending Lobby removed " + newLobby.lid);
        }.bind(this), 5000);

        return newLobby;
    },
    getPendingLobby: function(lid) {
        return this.lobbyMapPending.get(validate.parseId(lid));
    },
    verifyLobby: function(pLobby) {
        clearTimeout(this.pendingTimer);
        this.lobbyMap.set(pLobby.lid, pLobby);
        this.lobbyMapPending.delete(pLobby.lid);
        log.ws("Verified lobby " + pLobby.lid);
        return pLobby;
    },
    getLobby: function(lid) {
        return this.lobbyMap.get(validate.parseId(lid));
    }
};

var reqSymbol = Symbol("req");

var wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    verifyClient: function(info) {
        var query = url.parse(info.req.url, true).query;
        // Bereits Verifizierte Lobby (Spieler Join)
        var lobby = lobbys.getLobby(query.lid);
        if (lobby) {
            // Player verifizieren
            var player = lobby.getPendingPlayer(query.pid);
            if (player) {
                lobby.verifyPlayer(player);
                info.req[reqSymbol] = player;
                return true;
            } else {
                return false;
            }
        } else {
            // Nicht verifizierte Lobby (Admin Join)
            var pLobby = lobbys.getPendingLobby(query.lid);
            if (pLobby && pLobby.admin.pid === validate.parseId(query.pid)) {
                // Lobby & Admin verifizieren
                lobbys.verifyLobby(pLobby).verifyPlayer(pLobby.admin);
                info.req[reqSymbol] = pLobby.admin;
                return true;
            } else {
                return false;
            }
        }
        return false;
    }
});

httpServer.listen(serverPort);
log.info("HTTP Server running on Port " + serverPort);
log.ws("WebSocket Server running on Port " + serverPort);

wss.on("connection", function connection(ws) {

    var player = ws.upgradeReq[reqSymbol];
    player.ws = ws;

    ws.on("message", function(message) {
        console.log("websocket received: ", message);
        ws.send(message);
    });

    ws.on("error", function(err) {
        console.log("error", err);
    });

    ws.on("close", function(code) {
        
    });


});

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
