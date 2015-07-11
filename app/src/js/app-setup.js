// Statische Daten
var app = {
    models: {},
    collections: {},
    views: {},
    settings: {
        httpServer: "http://localhost:8080",
        websocketServer: "ws://localhost:8080",
        // Zum lokalen Speichen
        nameKey: "USERNAME"
    },
    lobbySettingsDefaults: {
        radius: {
            min: 300,
            max: 5000,
            defaultVal: 2000
        },
        timelimit: {
            min: 5,
            max: 120,
            defaultVal: 30
        },
        updatetime: {
            min: 1,
            max: 10,
            defaultVal: 3
        },
        hidingtime: {
            min: 1,
            max: 15,
            defaultVal: 3
        },
        timeout: {
            min: 10,
            max: 120,
            defaultVal: 30
        },
        maptype: {
            min: 0,
            max: 2,
            defaultVal: 0
        }
    },
    //TODO more groups?
    groupColors: {
        0: "transparent",
        1: "red",
        2: "green",
        3: "blue",
        4: "cyan",
        5: "magenta",
        6: "yellow"
    },
    // Templates
    JST: {},
    validate: {
        isValidName: function(name) {
            if (typeof name === "string" && name.length > 0) {
                return true;
            }
            return false;
        }
    }
};

// Setup beim Start der App
app.init = function() {
    // Lokalen Spieler erstellen
    var name = localStorage.getItem(app.settings.nameKey);
    appdata.self = new app.models.Player({
        pid: -1,
        name: name || "Unknown",
        group: -1,
        isAdmin: false
    });
    // Name lokal Speichen
    appdata.self.on("change:name", function() {
        localStorage.setItem(app.settings.nameKey, appdata.self.get("name"));
    });
};
// GET anfragen zum Server (JSON)
app.ajax = function(url, jsonObj) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: url,
            data: jsonObj,
            dataType: "json",
            error: reject,
            success: resolve
        });
    });
};

// Join & Create Lobby
app.createLobby = function(pw) {
    return app.ajax(app.settings.httpServer + "/createLobby", {
        name: appdata.self.get("name"),
        pw: pw
    }).then(function(json) {
        // Lobby & Spieler ID speichern
        // Standart Gruppe 0 = Mrx
        // Lobbyersteller ist immer Admin
        appdata.lobby.lid = json.lid;
        appdata.self.set({
            pid: json.pid,
            group: 0,
            isAdmin: true
        }, {silent: true});
        appdata.lobby.playersList = new app.collections.PlayersList();
    });
};

app.joinLobby = function(lid, pw) {
    return app.ajax(app.settings.httpServer + "/joinLobby", {
        name: appdata.self.get("name"),
        lid: lid,
        pw: pw
    }).then(function(json) {
        // Lobby & Spieler ID speichern
        // Standart Gruppe 1
        appdata.lobby.lid = lid;
        appdata.self.set({
            pid: json.pid,
            group: 1,
            isAdmin: false
        }, {silent: true});
        // Vorhandene Spieler
        appdata.lobby.playersList = new app.collections.PlayersList(json.playerCollection);
    });
};

// Daten, welche zur Laufzeit erstellt werden
var appdata = {
    // Settings für aktuelle Lobby
    lobby: {
        settings: {}
    },
    // Model für lokalen Spieler
    self: null
};