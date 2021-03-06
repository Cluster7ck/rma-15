//(function() {

// TODO Einstellungspage für Name
var setUsername = function() {
    var name = "test";
    if (app.validate.isValidName(name)) {
        appdata.self.set("name", name);
    } else {
        // TODO show error
    }
};

// Page Lobby create & join
var $pageLanding = $("#page-landing");
var $inputCreateLobbyPw = $("#input-create-lobby-pw");
// Focus auf Pw input
$("#popup-create-lobby").on("popupafteropen", function() {
    $inputCreateLobbyPw.focus();
});

$("#form-create-lobby").submit(function(e) {
    e.preventDefault();

    app.createLobby($inputCreateLobbyPw.val()).then(function() {
        // Bei Erfolg input löschen
        $inputCreateLobbyPw.val("");
        openLobby();
    }, function(xhr) {
        showLoginError($("#form-create-lobby .err-el"), xhr);
    });

});

var $inputJoinLobbyLid = $("#input-join-lobby-lid");
var $inputJoinLobbyPw = $("#input-join-lobby-pw");
// Focus auf lid input
$("#popup-join-lobby").on("popupafteropen", function() {
    $inputJoinLobbyLid.focus();
});

$("#form-join-lobby").submit(function(e) {
    e.preventDefault();

    app.joinLobby($inputJoinLobbyLid.val(), $inputJoinLobbyPw.val()).then(function() {
        $inputJoinLobbyLid.val("");
        $inputJoinLobbyPw.val("");
        openLobby();
    }, function(xhr) {
        showLoginError($("#form-join-lobby .err-el"), xhr);
    });

});
// Zeigt Fehler in $errorEl und setzt show-err Klasse
var showLoginError = function($errorEl, xhr) {
    $errorEl.html((xhr.responseJSON && xhr.responseJSON.errorMsg) || "Fehler bei Netzwerkanfrage");
    // Fehler Klasse resetten
    requestAnimationFrame(function() {
        // Klasse kurz entfernen, Frame abfragen
        $errorEl.removeClass("show-err");
        requestAnimationFrame(function() {
            $errorEl.addClass("show-err");
        });
    });
};

// Page Lobby
var $pageLobby = $("#page-lobby");

var openLobby = function() {
    // Setup
    $pageLobby.toggleClass("player-admin", appdata.self.isAdmin());
    // View für lokalen Spieler
    var $selfContainer = $pageLobby.find(".player-self-container");
    var selfView = new app.views.PlayerSelf({model: appdata.self}, $("#popup-select-group"));
    $selfContainer.append(selfView.render().el);
    appdata.selfView = selfView;
    // View für Liste
    var $listContainer = $pageLobby.find(".player-list-container");
    var $counter = $pageLobby.find(".player-counter");
    var playersListView = new app.views.PlayersList({collection: appdata.lobby.playersList}, $counter);
    $listContainer.append(playersListView.render().el);
    appdata.lobby.playersListView = playersListView;
    // Lobby ID Anzeigen
    $pageLobby.find(".lobby-id").html(appdata.lobby.lid);
    $.mobile.pageContainer.pagecontainer("change", $pageLobby);
};

$("#button-lobby-leave").click(function() {
    // TODO confirm
    closeLobby();
});
$("#button-lobby-close").click(function() {
    // TODO confirm
    closeLobby();
});
$("#button-lobby-start").click(function() {
    // TODO confirm
    // TODO tell server
    $.mobile.pageContainer.pagecontainer("change", $pageMap);
});

var closeLobby = function() {
    appdata.selfView.cleanup();
    appdata.selfView.remove();
    delete appdata.selfView;
    appdata.lobby.playersListView.cleanup();
    appdata.lobby.playersListView.remove();
    delete appdata.lobby.playersListView;
    app.leaveLobby();
    $.mobile.pageContainer.pagecontainer("change", $pageLanding);
};


// Tests
//var $pageInstructions = $("#page-instructions");
//$pageInstructions.on(
//        "pagebeforechange\
//        pagebeforecreate\
//        pagebeforehide\
//        pagebeforeshow\
//        pagechange\
//        pagecreate\
//        pagehide\
//        pageinit\
//        pageshow", function(e) {
//            console.log("instruct", e.type);
//        });

// Page Lobbysettings
var $pageLobbysettings = $("#page-lobbysettings");
var $lobbysettingsInputs;

$pageLobbysettings.on("pagecreate", function() {
    // Nach pagecreate auslesen, da die Elemente von jquery mobile verändert werden
    $lobbysettingsInputs = {
        radius: $("#input-lobbysettings-radius"),
        timelimit: $("#input-lobbysettings-timelimit"),
        updatetime: $("#input-lobbysettings-updatetime"),
        hidingtime: $("#input-lobbysettings-hidingtime"),
        timeout: $("#input-lobbysettings-timeout"),
        maptype: $("#input-lobbysettings-maptype")
    };
});

// Bei jedem Page show die Lobbysettings anzeigen
$pageLobbysettings.on("pagebeforeshow", function() {
    _.each($lobbysettingsInputs, function($el, setting) {
        // Gespeicherter Werte oder default Werte
        var value = appdata.lobby.settings[setting];
        $el.val(value);
        // UI Updaten
        if ($el.prop("name") === "maptype") {
            $el.selectmenu("refresh");
        } else {
            $el.slider("refresh");
        }
    });
});

$("#form-lobbysettings").submit(function(event) {
    event.preventDefault();

    _.each($lobbysettingsInputs, function($el, setting) {
        var value = $el.val();
        var limits = app.lobbySettingsDefaults[setting];
        // Wert zwischen min und max eingrenzen
        appdata.lobby.settings[setting] = Math.min(limits.max, Math.max(limits.min, value));
        // TODO zum Server senden
    });
    $.mobile.pageContainer.pagecontainer("change", $pageLobby);
});

$("#button-lobbysettings-reset").click(function() {
    // TODO Confirm
    _.each($lobbysettingsInputs, function($el, setting) {
        // Standard Werte eintragen und UI Updaten
        var value = app.lobbySettingsDefaults[setting].defaultVal;
        $el.val(value);
        if ($el.prop("name") === "maptype") {
            $el.selectmenu("refresh");
        } else {
            $el.slider("refresh");
        }
    });
});

//}());
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
//appdata.lobby.radius = 4000;
//// TODO auslesen per GPS
//appdata.lobby.mapCenter = {lat: 52.283343, lng: 8.035860};
//
//
//// ---> admin startet
//// ---> Wartezeit
//
//// ---> Spielbeginn
//// Spielstart
//

var $pageMap = $("#page-map");
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