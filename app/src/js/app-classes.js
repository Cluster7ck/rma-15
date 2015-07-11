/*
 * Templates
 */
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

/*
 * Model für Lokalen & andere Spieler
 */
app.models.Player = Backbone.Model.extend({
    // group 0 = mrx
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
/*
 * Collection für andere Spieler
 */
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