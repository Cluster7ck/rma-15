var serverHost = "localhost";
var serverPort = "8989";


//var ws = new WebSocket("ws://" + serverHost + ":" + serverPort);
//
//ws.onopen = function(e) {
//    console.log(e);
//};
//
//ws.onmessage = function(e) {
//    console.log(e);
//};
//
//ws.onclose = function(e) {
//    console.log(e);
//
//};
//
//ws.onerror = function(e) {
//    console.log(e);
//};

//var getSocket = function() {
//    return new Promise(function(resolve, reject) {
//        
//    });
//}

var center = {lat: 52.283343, lng: 8.035860};
var radius = 4000;

var mapOptions = {
    center: center,
    zoom: 11,
    panControl: false,
    zoomControl: true,
    zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL
    },
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    overviewMapControl: false

};
var map = new google.maps.Map(document.getElementById("game-map"), mapOptions);

//map.addListener("click", function(e) {
//    console.log(e);
//});

new google.maps.Circle({
    strokeColor: '#FF0000',
    strokeOpacity: 1,
    strokeWeight: 2,
    fillColor: '#FFFFFF',
    fillOpacity: 0,
    clickable: false,
    map: map,
    center: center,
    radius: radius
});

var colors = {
    1: "red",
    2: "green"
};

var players = [
    {
        name: "testuser1",
        pos: {lat: 52.28389822822902, lng: 8.00851821899414},
        group: 1
    },
    {
        name: "testuser2",
        pos: {lat: 52.28976460764183, lng: 8.042678833007812},
        group: 2
    }
];

playerMarkers = [];

players.forEach(function(player) {
    playerMarkers.push(new google.maps.Marker({
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            strokeWeight: 9,
            strokeColor: colors[player.group]
        },
        position: player.pos,
        map: map
    }));
});

var infowindow = new google.maps.InfoWindow({
    content: "Username: 500 Meter Entfernt",
    disableAutoPan: true
});

playerMarkers.forEach(function(marker) {
    marker.addListener("click", function() {
        infowindow.open(map, this);
    });
});

//var marker = new google.maps.Marker({
//    position: center,
//    map: map,
//    title: 'Hello World!'
//});