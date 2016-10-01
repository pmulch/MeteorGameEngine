/**
 * data.js
 * scope: client and server
 *
 * Declares all models, collections, and helper CRUD methods
 */


// models
/**
 * Generic instance that represents a Game
 * @constructor
 * @param {object} that - an object that contains properties that should be overridden when creating a new Game instance.
 */
Game = function(that) {
	_(this).extend({
		name: '',
		host: null, 
		players: [], 
		state: 'init',
		accessCode: null,
		active: false
	}, that);
};


// collections
/**
 * Games is the Meteor Collection which will store Game instances.
 * @type {Meteor.Collection}
 */
Games = new Meteor.Collection('games', { 
	transform: doc => new Game(doc)
});


// Extension Methods
_(Game.prototype).extend({
	/**
	 * Inserts 'this' Game into the Games collection. 
	 * Throws an error if 'this._id' is already set, or if something goes wrong with the Games.insert call.
	 */
	save: function() {
		let self = this; 	// self is the document being insert (saved)

		if ( self._id )
			throw `Cannot save item as it already has an id: "${self._id}". Use the update function instead.`;

		// update local _id reference
		self._id = Games.insert(self, (err, id) => { if (err) throw err; });
	},

	/**
	 * Updates 'this' Game within the Games collection with the specified changes. Automatically sets the 'modified' property to the current time.
	 * @param  {object} changes - flat object containing the properties to be modified in both the local object and the underlying collection. This uses the { $set: ... } Mongo call.
	 */
	update: function(changes) {
		var self = this;	// self is the document being updated
		
		if ( !_.isObject(changes) ) return;		// no changes to be made
		
		// set the modified flag
		_(changes).extend({
			modified: new Date()
		});

		// update the collection
		Games.update(self._id, { $set: changes }, (err, num) => { if (err) throw err; });

		// update the local copy
		_.extend(self, changes);
	},

	/**
	 * Adds the specified player object to the end of the game.players array.
	 * Generates an _id field on the player if it doesn't exist.
	 * @param {object} player - optional object representing the player that should be added. If not specified, a blank object will be initialized as a new player with default values. 
	 * @return {object} The player object that was added
	 */
	addPlayer: function(player) {
		var self = this,			// self is the Game instance being modified
			now = new Date(),
			player = player || {};	// ensure player object exists

		// generate a unique player ID (if needed)
		if (!(player._id))
			player._id = ID.generate();

		// save changes to the database
		Games.update(self._id, {
			$set: { modified: now }, 
			$push: { players: player }
		}, (err, num) => { if (err) throw err; });

		// apply changes locally
		self.modified = now;
		self.players.push(player);

		// return the player object that was added
		return player;
	},

	/**
	 * Updates the specified player object in 'this' Game with the specified changes.
	 * Throws an error if player is not found.
	 * @param  {object} player - the player object representing the player to be updated
	 * @param  {object} changes - flat object containing the properties to be modified in both the local object and the underlying collection. This uses the { $set: ... } Mongo call.
	 */
	updatePlayer: function(player, changes) {
		var self = this,			// self is the Game instance being modified
			now = new Date();

		// find index of specified player within self.players
		// NOTE: player instance provided might not === the player object within the array so look-up using _id first
		var match = player && player._id && _(self.players).find(p => p._id === player._id),
			index = match ? _(self.players).indexOf(match) : -1;		// -1 if no match was found by _id

		// if player is found, apply the changes
		if (index >= 0) {
			var parentChanges = { modified: now },
				prefix = 'players.'+index+'.';

			// prefix each change appropriately in the parent item (self) context
			_(changes).each((value, key) => parentChanges[prefix+key] = value);

			// apply the changes to the database
			Games.update(self._id, { $set: parentChanges }, (err, num) => { if (err) throw err; });

			// apply the changes locally
			_.extend(player, changes);
		}
		else {
			// else player not found - throw error
			throw 'The specified player could not be found in this Game.';	
		}
	}, 
	
	/**
	 * Removes the specified player object from the game.players array
	 * @param  {object} player - the player object representing the player to be removed
	 * @return {boolean} true if the player was successfully removed locally, false otherwise
	 */
	removePlayer: function(player) {
		var self = this,			// self is the Game instance being modified
			now = new Date();

		// save changes to the database
		Games.update(self._id, {
			$set: { modified: now }, 
			$pull: { players: player }
		}, (err, num) => { if (err) throw err; });

		// apply changes locally
		self.modified = now;
		var index = _.indexOf(self.players, player);
		if ( index >= 0 ) {
			self.players.splice(index, 1);
			return true;
		}

		// otherwise removal failed
		return false;
	}
});
