(function() {

    // Statische Daten
    var app = window.app = {
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
        // Templates
        JST: {},
        validate: {
            parseId: function(id) {
                id = Number.parseInt(id);
                return id >= 0 ? id : NaN;
            },
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
    var getJSON = function(url, jsonObj) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                url: app.settings.httpServer + url,
                data: jsonObj,
                dataType: "json",
                error: reject,
                success: resolve
            });
        });
    };

    // Join & Create Lobby
    app.createLobby = function(pw) {
        return getJSON("/createLobby", {
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
            openLobby();
        });
    };

    app.joinLobby = function(lid, pw) {
        return getJSON("/joinLobby", {
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
            openLobby(json.playerCollection);
        });
    };
    
    var openLobby = function(playerArray) {
        appdata.lobby.playersList = new app.collections.PlayersList(playerArray);
        // Default Settings Objekt
        appdata.lobby.settings = _.mapObject(app.lobbySettingsDefaults, _.property("defaultVal"));
    };

    app.leaveLobby = function() {
        // TODO Kill websocket
        delete appdata.lobby.playersList;
    };

    // Daten, welche zur Laufzeit erstellt werden
    window.appdata = {
        // Settings für aktuelle Lobby
        lobby: {
            settings: null
        },
        // Model für lokalen Spieler
        self: null
    };

}());