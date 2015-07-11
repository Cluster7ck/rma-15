// Statische Daten
var app = {
    models: {},
    collections: {},
    views: {},
    settings: {
        httpServer: "http://localhost:8080",
        websocketServer: "ws://localhost:8080",
        nameKey: "USERNAME"
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
    JST: {}
};

app.validate = {
    isValidName: function(name) {
        if (typeof name === "string" && name.length > 0) {
            return true;
        }
        return false;
    }
};

app.JST.player = _.template('\
        <div class="player-name"><%- data.name %><% if (data.isAdmin) { %> (Admin)<% } %></div>\
        <div class="player-info">\
            <div class="player-group">G<%= data.group %></div>\
            <button class="ui-btn ui-icon-delete ui-btn-icon-notext player-delete"></button>\
        </div>'
        , {variable: "data"}
);

app.JST.playerSelf = _.template('\
        <div class="player-name"><%- data.name %><% if (data.isAdmin) { %> (Admin)<% } %></div>\
        <div class="player-info">\
            <button class="ui-btn player-group">G<%= data.group %></button>\
        </div>'
        , {variable: "data"}
);

app.init = function() {
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
// TODO Einstellungspage für Name
var setUsername = function() {
    var name = "test";
    if (app.validate.isValidName(name)) {
        appdata.self.set("name", name);
    } else {
        // TODO show error
    }
};

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
        // Lobby setup
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
        // Lobby join
        appdata.lobby.lid = lid;
        appdata.self.set({
            pid: json.pid,
            group: 1,
            isAdmin: false
        }, {silent: true});
        appdata.lobby.playersList = new app.collections.PlayersList(json.playerCollection);
    });
};

// Daten, welche zur Laufzeit erstellt werden
var appdata = {
    // Settings für aktuelle Lobby
    lobby: {
        // TODO default settings
    },
    // Daten über diesen Spieler in aktueller Lobby
    self: null
};

var $pageLobby = $("#page-lobby");

$("#form-create-lobby").submit(function(event) {
    event.preventDefault();
    var $errEl = $("#form-create-lobby .err-el");
    var pw = $("#input-create-lobby-pw").val();

    app.createLobby(pw).then(function() {
        $.mobile.pageContainer.pagecontainer("change", $pageLobby);
    }, function(xhr) {
//        $.mobile.pageContainer.pagecontainer("change", $pageLobby);
        console.log(xhr);
        $errEl.html((xhr.responseJSON && xhr.responseJSON.errorMsg) || "Fehler bei Netzwerkanfrage");

        requestAnimationFrame(function() {
            $errEl.removeClass("show-err");
            requestAnimationFrame(function() {
                $errEl.addClass("show-err");
            });
        });
    });

});

$("#form-join-lobby").submit(function(event) {
    event.preventDefault();
    var $errEl = $("#form-join-lobby .err-el");
    var lid = $("#input-join-lobby-lid").val();
    var pw = $("#input-join-lobby-lid").val();

    app.joinLobby(lid, pw).then(function(data) {

        $.mobile.pageContainer.pagecontainer("change", $pageLobby);
    }, function(xhr) {
        $errEl.html((xhr.responseJSON && xhr.responseJSON.errorMsg) || "Fehler bei Netzwerkanfrage");
        $errEl.removeClass("show-err");

        requestAnimationFrame(function() {
            $errEl.removeClass("show-err");
            requestAnimationFrame(function() {
                $errEl.addClass("show-err");
            });
        });
    });

});

$pageLobby.on("pagecreate", function() {
    
    $selfContainer = $pageLobby.find(".player-self-container");
    var selfView = new app.views.PlayerSelf({model: appdata.self});
    $selfContainer.append(selfView.render().el);
    appdata.selfView = selfView;

    $listContainer = $pageLobby.find(".player-list-container");
    $counter = $pageLobby.find(".player-counter");
    var playersListView = new app.views.Players({collection: appdata.lobby.playersList}, $counter);
    $listContainer.append(playersListView.render().el);
    appdata.playersListView = playersListView;
});

$pageLobby.on("pagebeforeshow", function() {
    $pageLobby.find(".lobby-id").html(appdata.lobby.lid);
});

$pageInstructions = $("#page-instructions");
$pageInstructions.on(
        "pagebeforechange\
 pagebeforecreate\
 pagebeforehide\
 pagebeforeshow\
 pagechange\
 pagecreate\
 pagehide\
 pageinit\
 pageshow", function(e) {
            console.log("instruct", e.type);
        });




app.models.Player = Backbone.Model.extend({
    isMrx: function() {
        return this.get("group") === 0;
    },
    isAdmin: function() {
        return this.get("isAdmin");
    },
    getGroupColor: function() {
        return app.groupColors[this.get("group")];
    }
});

app.collections.PlayersList = Backbone.Collection.extend({
    model: app.models.Player
});


// Shared Code
var playerRender = function() {
    this.$el.html(this.template(this.model.attributes));
        this.$el.toggleClass("player-is-mrx", this.model.isMrx());
        this.$el.toggleClass("player-is-admin", this.model.isAdmin());
        if (!this.model.isMrx()) this.$(".player-group").css("background-color", this.model.getGroupColor());
        return this;
};

/*
 * View für einen einzelnen Player in der Players Collection
 */
app.views.Player = Backbone.View.extend({
    tagName: "li",
    template: app.JST.player,
    initialize: function() {
        this.listenTo(this.model, "change", this.render);
        // Beim löschen aus Collection
        this.listenTo(this.model, "remove", this.remove);
    },
    events: {
        "click .player-delete": "deletePlayer"
    },
    render: playerRender,
    deletePlayer: function(e) {
        if (!appdata.self.isAdmin()) return;
        // TODO delete
        // frage user
        
        console.log(e);
    }
});

/*
 * View für lokalen Spieler
 */
app.views.PlayerSelf = Backbone.View.extend({
    className: "player-self",
    template: app.JST.playerSelf,
    initialize: function() {
        this.listenTo(this.model, "change", this.render);
    },
    events: {
        "click .player-group": "changeGroup"
    },
    render: playerRender,
    changeGroup: function() {
        console.log("change group");
        //TODO frage user
        var newGroup = 2;
        appdata.self.set("group", newGroup);
    },
    cleanup: function() {
        this.stopListening();
    }
});

/*
 * View für die Players Collection
 */
app.views.Players = Backbone.View.extend({
    tagName: "ul",
    className: "player-list",
    initialize: function(options, $counterEl) {
        this.$counterEl = $counterEl;
        this.listenTo(this.collection, "add", this.renderOne);
        this.listenTo(this.collection, "add", this.updateCounter);
        this.listenTo(this.collection, "remove", this.updateCounter);
    },
    render: function() {
        this.$el.toggleClass("player-admin-list", appdata.self.isAdmin());
        // Ganze Collection rendern
        this.collection.each(function(player) {
            this.renderOne(player);
        }, this);
        return this;
    },
    // Einzelnen Player hinzufügen
    renderOne: function(player) {
        var playerView = new app.views.Player({model: player});
        // Zum aufräumen
        playerView.listenTo(this, "cleanup", playerView.stopListening);
        this.$el.append(playerView.render().el);
    },
    // Zähler anzeigen
    updateCounter: function() {
        this.$counterEl.html(this.collection.length);
    },
    cleanup: function() {
        // Events bei jedem Player view löschen
        this.trigger("cleanup");
        this.stopListening();
    }
});


var testusers = [
    {
        pid: 123,
        name: "Username",
        group: 1,
        isAdmin: false
    }, {
        pid: 124,
        name: "Admin & Mr z",
        group: 0,
        isAdmin: true
    },
    {
        pid: 125,
        name: "Admin",
        group: 2,
        isAdmin: true
    },
    {
        pid: 126,
        name: "mr z",
        group: 0,
        isAdmin: false
    }
];

appdata.lobby.playersList = new app.collections.PlayersList(testusers);


// ---> Startpage
// ---> Einstellungen

// ---> Erstellen einer Lobby
// sende anfrage
// sende name
// 


// ----> Betreten der Lobby
// sende anfrage
// sende lobby id
// sende name
// Bestätigung vom Server
// TODO update lobby settings
// appdata.lobby ...

// ---->
// Lobby Page aufrufen
// Player Collection erstellen


// Player View Rendern


// Updates (create, update, delete)
//  //appdata.players.set({
//    id: 123,
//    name: "foo",
//    group: 5,
//    mrx: false
//}, {add: false, remove: false});

//appdata.players.add({
//    id: 123,
//    name: "foo",
//    group: 5,
//    mrx: false
//});
//
//appdata.players.remove(id)


// Updates Einstellungen
// TODO Einstellungen anzeigen



// Lobby verlassen
// TODO
// Kill Websocket
// remove collection
// remove views
// 
// goto Startpage

//var ws = new WebSocket("ws://" + app.settings.serverHost + ":" + app.settings.serverPort + "/ws?lid=1");

//function wsevents(ws) {
//    ws.onopen = function(e) {
//        console.log(e);
//    };
//
//    ws.onmessage = function(e) {
//        console.log(e);
//    };
//
//    ws.onclose = function(e) {
//        console.log(e);
//    };
//
//    ws.onerror = function(e) {
//        console.log(e);
//    };
//}

//$("#ws1").on("click", function() {
//    ws = new WebSocket("ws://localhost:8080/ws?lid=" + lid + "&pid=0");
//    wsevents(ws);
//});
//
//$("#ws2").on("click", function() {
//    ws = new WebSocket("ws://localhost:8080/ws?lid=" + lid + "&pid=1");
//    wsevents(ws);
//});

//var getSocket = function() {
//    return new Promise(function(resolve, reject) {
//        
//    });
//}

// TODO Einstellungen beachten
appdata.lobby.radius = 4000;
//// TODO auslesen per GPS
appdata.lobby.mapCenter = {lat: 52.283343, lng: 8.035860};
//
//
//// ---> admin startet
//// ---> Wartezeit
//
//// ---> Spielbeginn
//// Spielstart
//

//$pageMap = $("#page-map");
//
//$pageMap.on("pagebeforeshow", function() {
//    var mapContainer = document.getElementById("map-container");
//    var mapDiv = document.createElement("div");
//    mapContainer.appendChild(mapDiv);
//
//    var mapOptions = {
//        center: appdata.lobby.mapCenter,
//        zoom: 11,
//        panControl: false,
//        zoomControl: true,
//        zoomControlOptions: {
//            style: google.maps.ZoomControlStyle.SMALL
//        },
//        mapTypeControl: false,
//        scaleControl: false,
//        streetViewControl: false,
//        overviewMapControl: false
//    };
//
//    var map = appdata.lobby.map = new google.maps.Map(mapDiv, mapOptions);
//
//    new google.maps.Circle({
//        strokeColor: '#FF0000',
//        strokeOpacity: 1,
//        strokeWeight: 2,
//        fillColor: '#FFFFFF',
//        fillOpacity: 0,
//        clickable: false,
//        map: map,
//        center: appdata.lobby.mapCenter,
//        radius: appdata.lobby.radius
//    });
//
//});

// TODO zeit pos nächste mrx pos

// Updates an Server
// pos
// Auch auf karte malen

// Updates vom Server
// 
// Mrx
// pos änderungen aller spieler: auf karte malen
//
// Spieler
// Mrx alle x min
//
// Spieler beendet
// Marker löschen


// < 2 Spieler oder mrx raus -> server beendet

// Zeitablauf mrx gewinnt -> anzeige -> spielende
// Spieler finde x -> anzeige -> spielende

//var playerPositions = {
//    123: {lat: 52.28389822822902, lng: 8.00851821899414},
//    124: {lat: 52.28976460764183, lng: 8.042678833007812}
//};
//
//appdata.lobby.playerMarkers = [];
//
//playerPositions.forEach(function(player) {
//    playerMarkers.push(new google.maps.Marker({
//        icon: {
//            path: google.maps.SymbolPath.CIRCLE,
//            scale: 6,
//            strokeWeight: 9,
//            strokeColor: app.groupColors[player.group]
//        },
//        position: player.pos,
//        map: map
//    }));
//});
//
//var infowindow = new google.maps.InfoWindow({
//    content: "Username: 500 Meter Entfernt",
//    disableAutoPan: true
//});
//
//playerMarkers.forEach(function(marker) {
//    marker.addListener("click", function() {
//        infowindow.open(map, this);
//    });
//});

//var marker = new google.maps.Marker({
//    position: center,
//    map: map,
//    title: 'Hello World!'
//});




//
//  Verbindungsabbruch
//  Mitteilung an alle
//  
//  Timeout -> cleanup -> startpage
//  
//  Reconnect, sende id -> wiedereintritt 
//

// Manuell Austreten -> cleanup -> startpage

// cleanup
// remove map
// remove markers
// remove ...
// 


// Spielende -> cleanup
// goto Lobby

if (window.cordova) {
    document.addEventListener("deviceready", app.init);
} else {
    app.init();
}