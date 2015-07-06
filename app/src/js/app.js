var app = {
    models: {},
    collections: {},
    views: {},
    settings: {
        serverHost: "localhost",
        serverPort: "8080"
    }
};
//TODO fill
app.groupColors = {
    1: "red",
    2: "green"
};
var appdata = {
    // Settings für aktuelle Lobby
    lobby: {
        // TODO default settings
    },
    // Daten über diesen Spieler in aktueller Lobby
    self: {}
};
// TODO save / read from localstorage
appdata.self.name = "Noname";
JST = {};
JST.player = _.template('\
        <div class="player-name"><%- data.name %></div>\
        <div class="player-info">\
            <% if (data.mrx) { %>\
            <div class="player-x"></div>\
            <% } else { %>\
            <div class="player-group" data-group="<%- data.group %>"></div>\
            <% } %>\
            <div class="player-delete"></div>\
        </div>'
        , {variable: "data"}
);


$("#submitJoin").submit(function(event) {

    event.preventDefault();
    if($(this).find('input[name="gameid"]').val() === "" || $(this).find('input[name="password"]').val()=== ""){
        console.log("passiert was im if!")
    }
    
    appdata.lobby.lid = $(this).find('input[name="gameid"]').val();
    console.log("passiert was!");

    $.getJSON("http://localhost:8080/joinLobby",
            {
                lid: appdata.lobby.lid ,
                pw: $(this).find('input[name="password"]').val(),
                name: "user"+Math.floor((Math.random() * 100) + 1)
            })
    .done(function(data, textStatus, xhr){
        appdata.self.pid = data.pid;

        $( ":mobile-pagecontainer" ).pagecontainer( "change", $("#lobby"), { role: "dialog" } );
    })  
    .fail(function (xhr, textStatus, errorThrown) {
        $("#submitJoin").find(".joinErrMsg").css({"display": "block"});
        if(xhr.status === 404){
            $("#submitJoin").find(".joinErrMsg").html("Diese Lobby existiert nicht");
        }
        else if(xhr.status === 401){
            $("#submitJoin").find(".joinErrMsg").html("Das eingegebene Passwort ist Falsch");
        }
        else if(xhr.status === 422){
            $("#submitJoin").find(".joinErrMsg").html("Der gewählte Name ist ungültig");
        }
        else if(xhr.status === 503){
            $("#submitJoin").find(".joinErrMsg").html("Die Lobby ist voll");
        }
        
        $("#submitJoin").find(".joinErrMsg").removeClass("joinError");
        setTimeout(function(){
            $("#submitJoin").find(".joinErrMsg").addClass("joinError");
        },10);

    });
    

});

$("#submitCreate").submit(function(event) {

    event.preventDefault();
    console.log("createSubmit");
    if($(this).find('input[name="password"]').val() === "" ){
        $(".createErrMsg").css({"display": "block"});
        $(".createErrMsg").html("Passwort eingeben");
        setTimeout(function(){
            $(".createErrMsg").addClass("joinError");
        },10);
    }else{
        $(".createErrMsg").css({"display": "none"});
        
            $.getJSON("http://localhost:8080/createLobby",
            {
                name: "user"+Math.floor((Math.random() * 100) + 1),
                pw: $(this).find('input[name="password"]').val()
            })
            .done(function(json) {
                console.log(json);
                appdata.lobby.lid = json.lid;
                
                $( ":mobile-pagecontainer" ).pagecontainer( "change", $("#lobby"));
            })
            .fail(function (xhr, textStatus, errorThrown) {
                $(".createErrMsg").css({"display": "block"});
                $(".createErrMsg").html(xhr.responseJSON.errorMsg);
            });
        
    }
    
});

app.models.Player = Backbone.Model.extend({
});


app.collections.Players = Backbone.Collection.extend({
    model: app.models.Player
});

/*
 * View für einen einzelnen Player in der Players Collection
 */
app.views.Player = Backbone.View.extend({
    tagName: "li",
    initialize: function() {
        this.listenTo(this.model, "change", this.render);
        this.listenTo(this.model, "remove", this.remove);
    },
    render: function() {
        this.$el.html(JST.player(this.model.attributes));
        this.$el.toggleClass("player-mrx", this.model.get("mrx"));
        this.$el.toggleClass("player-admin", this.model.get("admin"));

        return this;
    }
});

app.views.PlayerAdmin = app.views.Player.extend({
    events: {
        "click .player-delete": "deletePlayer"
    },
    deletePlayer: function(e) {
        // TODO delete
        console.log(e);
    }
});

app.views.PlayerSettings = Backbone.View.extend({
    events: {
        // TODO make name / group changable
        // change name
        "click .player-group": "changeGroup"
    },
    render: function() {
        this.$el.html(JST.player(this.model.attributes));
        // Klasse anpassen
        this.$el.toggleClass("player-mrx", this.model.get("mrx"));
        return this;
    },
    changeName: function() {
        // TODO save to localstorage
    }
});

/*
 * View für die Players Collection
 */
app.views.Players = Backbone.View.extend({
    tagName: "ul",
    id: "player-list",
    className: function() {
        if (appdata.self.isAdmin) {
            return "player-list-admin";
        }
    },
    initialize: function() {
        // Bei reset rendern
        this.listenTo(this.collection, "reset", this.render);
        // Bei einem neuen Player in der Collection
        this.listenTo(this.collection, "add", this.renderOne);
    },
    render: function() {
        // Ganze Collection rendern
        this.collection.each(function(player) {
            this.renderOne(player);
        }, this);
        return this;
    },
    renderOne: function(player) {
        var view = appdata.self.isAdmin ? app.views.PlayerAdmin : app.views.Player;
        var playerView = new view({model: player});
        //playerView.listenTo(this, "close", playerView.stopListening);
        this.$el.append(playerView.render().el);
    },
    close: function() {
        //Feuer remove event auf alle Player
        this.collection.each(function(player) {
            player.trigger("remove");
        });
    }
});


var testusers = [
    {
        id: 123,
        name: "Username",
        group: 1,
        mrx: false,
        admin: false
    },
    {
        id: 124,
        name: "Ravensburger Anwalt für Namensrechte",
        group: 2,
        mrx: false,
        admin: false
    },
    {
        id: 125,
        name: "1337 H4X0R <script>alert('ha!')</script>",
        group: 2,
        mrx: false,
        admin: false
    },
    {
        id: 126,
        name: "Nicht Mr. X",
        group: 1,
        mrx: true,
        admin: false
    }
];

// ---> Startpage
// ---> Einstellungen


// ---> Erstellen einer Lobby
// sende anfrage
// sende name
// 
// Vom server:
appdata.lobby.id = 12345;


appdata.self.id = 122;
appdata.self.isAdmin = true;
appdata.self.isMrx = true;


// ----> Betreten der Lobby
// sende anfrage
// sende lobby id
// sende name
// Bestätigung vom Server
appdata.self.id = 122;
appdata.self.isAdmin = false;
appdata.self.isMrx = false;
// TODO update lobby settings
// appdata.lobby ...

// ---->
// Lobby Page aufrufen
// Player Collection erstellen

appdata.lobby.players = new app.collections.Players(testusers);

// Player View Rendern

var $playerListContainer = $("#lobby .playerList");
var playersView = new app.views.Players({collection: appdata.lobby.players});
$playerListContainer.append(playersView.render().el);


// Updates (create, update, delete)
// 
//appdata.players.set({
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

//app.views.Manage = Backbone.View.extend({
//    initialize: function() {
//        if (!appdata.collections.forms) {
//            // Collection erstellen, wenn noch nicht vorhanden
//            this.collection = appdata.collections.forms = new app.collections.Forms;
//            // Aus Datenbank lesen
//            this.collection.fetch({reset: true}).catch(function(err) {
//                console.warn(err);
//            });
//        }
//        // für Effekte am Update Button
//        this.showSuccess = this.showEffect.bind(this, "success");
//        this.showError = this.showEffect.bind(this, "error");
//        _.bindAll(this, "removeEffects");
//    },
//    render: function() {
//        this.$el.html(JST.manage());
//        this.$formlist = this.$(".list");
//        this.formsView = new app.views.Forms({collection: this.collection});
//        // Die Form-Liste wird direkt gerendert. Wenn die Collection leer ist, passiert nichts und nach dem "reset" aus der Datenbank wird nochmal gerendert
//        this.$formlist.append(this.formsView.render().el);
//        return this;
//    },
//    // Aufräumen
//    onClose: function() {
//        this.collection.removeOfflineCache();
//        this.formsView.trigger("close");
//        this.formsView.stopListening();
//    }
//});

//var ws = new WebSocket("ws://" + app.settings.serverHost + ":" + app.settings.serverPort + "/ws?lid=1");

function wsevents(ws) {
    ws.onopen = function(e) {
        console.log(e);
    };

    ws.onmessage = function(e) {
        console.log(e);
    };

    ws.onclose = function(e) {
        console.log(e);
    };

    ws.onerror = function(e) {
        console.log(e);
    };
}

//var lid;
//var ws;
//$("#createLobby").on("click", function() {
//    $.getJSON("http://localhost:8080/createLobby", {name: "adminName", pw: "123"}).done(function(json) {
//        console.log(json);
//        lid = json.lid;
//    });
//});
//
//$("#joinLobby").on("click", function() {
//    $.getJSON("http://localhost:8080/joinLobby", {name: "PlayerName", pw: "123", lid: lid}).done(function(json) {
//        console.log(json);
//    });
//});
//
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
//appdata.lobby.center = {lat: 52.283343, lng: 8.035860};
//
//
//// ---> admin startet
//// ---> Wartezeit
//
//// ---> Spielbeginn
//// Spielstart
//
//var mapOptions = {
//    center: appdata.lobby.center,
//    zoom: 11,
//    panControl: false,
//    zoomControl: true,
//    zoomControlOptions: {
//        style: google.maps.ZoomControlStyle.SMALL
//    },
//    mapTypeControl: false,
//    scaleControl: false,
//    streetViewControl: false,
//    overviewMapControl: false
//
//};
//appdata.lobby.map = new google.maps.Map(document.getElementById("game-map"), mapOptions);
//
////map.addListener("click", function(e) {
////    console.log(e);
////});
//
//new google.maps.Circle({
//    strokeColor: '#FF0000',
//    strokeOpacity: 1,
//    strokeWeight: 2,
//    fillColor: '#FFFFFF',
//    fillOpacity: 0,
//    clickable: false,
//    map: appdata.lobby.map,
//    center: appdata.lobby.center,
//    radius: appdata.lobby.radius
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