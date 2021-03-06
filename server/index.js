"use strict";
var http = require("http");
var url = require("url");
var WebSocketServer = require("ws").Server;
var log = require("./logger.js");

var serverPort = 8080;
var verifyTimeout = 5000;

var defaultHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
};

var ERROR_CODES = {
    SERVER_FULL: 1,
    LOBBY_FULL: 2,
    LOBBYID_MISSING: 3,
    PW_MISSING: 4,
    INVALID_PW: 5,
    INVALID_NAME: 6,
    LOBBY_NOT_FOUND: 7,
    INCORRECT_PW: 8
};
var ERROR_MSG = {
    1: "Server voll",
    2: "Lobby voll",
    3: "Lobby ID nicht angegeben",
    4: "Passwort nicht angegeben",
    5: "Ungültiges Passwort",
    6: "Ungültiger Username",
    7: "Lobby nicht gefunden",
    8: "Passwort falsch"
};

// HTTP Anfrage mit Fehler beenden
function writeErr(res, status, errCode) {
    var msg = errCode ? ERROR_MSG[errCode] : http.STATUS_CODES[status];
    log.http("End with Error:", status, msg);
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
    log.http("Action:", action);
    var actionFn = getActions[action];
    if (actionFn) {
        actionFn(req, res, parsedURL.query);
    } else {
        // Unbekannte Aktion -> 404
        writeErr(res, 404);
    }

});

httpServer.on("clientError", function(err) {
    log.err("HTTP Server Error", err);
});

var getActions = {
    "joinLobby": function(req, res, query) {
        var lid = query.lid;
        var pw = query.pw;
        var name = query.name;

        if (lid === undefined || lid === "") {
            // 422 Unprocessable Entity
            writeErr(res, 422, ERROR_CODES.LOBBYID_MISSING);
            return;
        }
        if (pw === undefined || pw === "") {
            // 422 Unprocessable Entity
            writeErr(res, 422, ERROR_CODES.PW_MISSING);
            return;
        }

        var lobby = lobbys.getLobby(validate.parseId(lid));
        if (lobby === undefined) {
            // Not Found
            writeErr(res, 404, ERROR_CODES.LOBBY_NOT_FOUND);
            return;
        }
        if (lobby.pw !== pw) {
            // 401 Unauthorized
            writeErr(res, 401, ERROR_CODES.INCORRECT_PW);
            return;
        }
        if (!validate.isValidName(name)) {
            // 422 Unprocessable Entity
            writeErr(res, 422, ERROR_CODES.INVALID_NAME);
            return;
        }
        if (lobby.isFull()) {
            // 503 Service Unavailable
            writeErr(res, 503, ERROR_CODES.LOBBY_FULL);
            return;
        }
        // New Pending Player
        var newPlayer = lobby.addPlayer(name);
        // Mit pid und allen anderen Spielern als Array antworten
        writeEnd(res, {
            pid: newPlayer.pid,
            playerCollection: lobby.getPlayersArray(newPlayer.pid)
        });
    },
    "createLobby": function(req, res, query) {
        var pw = query.pw;
        var name = query.name;

        if (pw === undefined || pw === "") {
            // 422 Unprocessable Entity
            writeErr(res, 422, ERROR_CODES.PW_MISSING);
            return;
        }
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
        if (typeof pw === "string" && pw.length > 0 && pw.length < 200) {
            return true;
        }
        return false;
    },
    isValidName: function(name) {
        if (typeof name === "string" && name.length > 0 && name.length < 200) {
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
        log.http("New pending player in lobby:", this.lid);
        // Remove Pending Player after Timeout
        this.pendingTimer = setTimeout(function() {
            this.playerMapPending.delete(newPlayer.pid);
            log.http("Pending player removed from lobby:", this.lid);
        }.bind(this), verifyTimeout);
        return newPlayer;
    },
    removePlayer: function(pid) {
        this.playerMap.delete(pid);
    },
    getPendingPlayer: function(pid) {
        return this.playerMapPending.get(pid);
    },
    verifyPlayer: function(pPlayer) {
        clearTimeout(this.pendingTimer);
        this.playerMap.set(pPlayer.pid, pPlayer);
        this.playerMapPending.delete(pPlayer.pid);
        log.ws("Verified player in lobby:", this.lid);
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
                    isAdmin: this.admin === player
                });
            }
        }, this);
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

        var newAdmin = newLobby.addPlayer(adminName);
        newAdmin.group = 0;
        newLobby.mrx = newAdmin;
        newLobby.admin = newAdmin;
        this.lobbyMapPending.set(newLobby.lid, newLobby);
        log.http("New pending lobby:", newLobby.lid);
        // Timeout
        this.pendingTimer = setTimeout(function() {
            this.lobbyMapPending.delete(newLobby.lid);
            log.http("Pending pobby removed:", newLobby.lid);
        }.bind(this), verifyTimeout);

        return newLobby;
    },
    getLobby: function(lid) {
        return this.lobbyMap.get(lid);
    },
    getPendingLobby: function(lid) {
        return this.lobbyMapPending.get(lid);
    },
    verifyLobby: function(pLobby) {
        clearTimeout(this.pendingTimer);
        this.lobbyMap.set(pLobby.lid, pLobby);
        this.lobbyMapPending.delete(pLobby.lid);
        log.ws("Verified lobby:", pLobby.lid);
        return pLobby;
    }
};

var reqSymbol = Symbol("req");

var wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    verifyClient: function(info) {
        var query = url.parse(info.req.url, true).query;
        var lid = validate.parseId(query.lid);
        var pid = validate.parseId(query.pid);
        // Bereits Verifizierte Lobby (Spieler Join)
        var lobby = lobbys.getLobby(lid);
        if (lobby) {
            // Player verifizieren
            var player = lobby.getPendingPlayer(pid);
            if (player) {
                lobby.verifyPlayer(player);
                info.req[reqSymbol] = player;
                return true;
            } else {
                return false;
            }
        } else {
            // Nicht verifizierte Lobby (Admin Join)
            var pLobby = lobbys.getPendingLobby(lid);
            if (pLobby && pLobby.admin.pid === pid) {
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
log.info("HTTP Server running on Port", serverPort);
log.ws("WebSocket Server running on Port", serverPort);

wss.on("connection", function connection(ws) {

    var player = ws.upgradeReq[reqSymbol];
    player.ws = ws;

    ws.on("message", function(message) {
        console.log("websocket received: ", message);
        ws.send(message);
    });

    ws.on("close", function(code) {
        console.log("close", code);
    });

    ws.on("error", function(err) {
        log.err("Websocket Server Error", err);
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

var newL = lobbys.addLobby("1", "AdminName");
lobbys.verifyLobby(newL).verifyPlayer(newL.admin);

var newP = newL.addPlayer("Player1");
newL.verifyPlayer(newP);
newP = newL.addPlayer("Player2");
newL.verifyPlayer(newP);
newP = newL.addPlayer("Player3");
newL.verifyPlayer(newP);