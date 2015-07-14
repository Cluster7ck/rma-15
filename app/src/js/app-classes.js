(function() {

    /*
     * Model für Lokalen & andere Spieler
     */
    app.models.Player = Backbone.Model.extend({
        idAttribute: "pid",
        // group 0 = mrx
        isMrx: function() {
            return this.get("group") === 0;
        },
        isAdmin: function() {
            return !!this.get("isAdmin");
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
        return this;
    };

    /*
     * View für einen einzelnen Player in der Players Collection
     */
    app.views.Player = Backbone.View.extend({
        tagName: "li",
        template: _.template($("#template-player").html(), {variable: "data"}),
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
        template: _.template($("#template-self").html(), {variable: "data"}),
        initialize: function(options, $popup) {
            this.listenTo(this.model, "change", this.render);
            this.saveGroup = this.saveGroup.bind(this);
            this.$popup = $popup;
            $popup.on("click", "button", this.saveGroup);
        },
        events: {
            "click .player-group": "changeGroup"
        },
        render: playerRender,
        changeGroup: function() {
            this.$popup.popup("open");
        },
        saveGroup: function(e) {
            this.$popup.popup("close");
            // TODO
            var newGroup = app.validate.parseId(e.target.dataset.group);
            // newGroup -> server
        },
        cleanup: function() {
            this.$popup.off("click", this.saveGroup);
        }
    });

    /*
     * View für die Players Collection
     */
    app.views.PlayersList = Backbone.View.extend({
        tagName: "ul",
        className: "player-list",
        initialize: function(options, $counterEl) {
            this.$counterEl = $counterEl;
            this.listenTo(this.collection, "add", this.renderOne);
            this.listenTo(this.collection, "add", this.updateCounter);
            this.listenTo(this.collection, "remove", this.updateCounter);
        },
        render: function() {
            // Ganze Collection rendern
            this.collection.each(function(player) {
                this.renderOne(player);
            }, this);
            this.updateCounter();
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

}());