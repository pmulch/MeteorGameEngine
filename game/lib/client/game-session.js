/**
 * game-session.js
 * scope: client
 *
 * Manages the currently active game session
 */

/**
 * Manages the currently active Game session, relying on Session and Local Storage to preserve and restore state.
 * @type {Object}
 */
GameSession = {

	/**
	 * Sets the game and player (based on the specified ids) for the active session + caches it to local storage
	 * @param  {String} gameId - the id of the Game instance being saved as the active game
	 * @param  {String} playerOrHostId - the id of the current player or host within the specified game
	 */
	save: (gameId, playerOrHostId) => {
		if ( !gameId || !playerOrHostId ) {
			console.warn('GameSession.save called without a valid game id or player id - ignored', gameId, playerOrHostId);
			return;
		}

		// set the active game and user
		Session.set('active.gameId', gameId);
		Session.set('active.userId', playerOrHostId);

		// remember (game.{ID} -> {playerId}) for later recovery
		Session.setPersistent('game.'+gameId, playerOrHostId);	
	},

	/**
	 * Finds the appropriate game and sets it as the active game via Session['active.gameId']. 
	 * This should typically be called by the page after subscribing to the games collection, once loaded / reloaded. 
	 * This process will trigger a restore of the game session if needed (based on a previous call to GameSession.save).
	 * @param  {string} gameIdOrAccessCode - the id or access code of the game
	 */
	load: (gameIdOrAccessCode) => {
		if ( !gameIdOrAccessCode ) return;
		
		// find the game
		let game = Games.findOne({ $or: [{ _id: gameIdOrAccessCode }, { accessCode: gameIdOrAccessCode }] });
		if ( game ) {
			// we found one, so set it as active for this session
			Session.set('active.gameId', game._id);			// this should trigger a restore of the session if need be
		}
		// else: no game found, do nothing
	},

	/**
	 * Internal helper that restores the current active user based on the current active game as set in Session['active.gameId']
	 * Shouldn't need to call this explicity for normal usage.
	 * @return {String} the user ID associated with this user, or null/undefined if the user is not part of the game
	 */
	restore: () => {
		// fetch the active game id
		let gameId = Session.get('active.gameId');
		if ( !gameId ) return;		// no active game

		// get a fresh copy of the active game
		let game = gameId && Games.findOne({ _id: gameId });
		if ( !game ) return;		// short-circuit out if the active game instance is not available

		// fetch the user based on cached information: (game.{ID} -> {playerId})
		let userId = Session.get('game.'+game._id);

		// check to see if the user is part of the game
		if ( userId ) {
			if ( userId !== game.host._id && _(game.players).every(p => p._id !== userId) ) {
				// the userId does not match any players or the host
				// happens for invalid ids or when a user gets booted out of a game

				// clear the cache entry for this user
				Session.clear('game.'+game._id);
				userId = null;						// force the active user to null since they aren't part of the game
			}
			// else the user is a part of the game
		}
		// else: user is not part of the game

		// set the active user
		Session.set('active.userId', userId);		// will be null/undefined if the user is not part of the game
		
		return userId;
	},

	/**
	 * Clears the active session and removes it from the local storage cache
	 */
	clear: () => {
		// clear the active game entry in the cache
		let gameId = Session.get('active.gameId');
		if ( gameId ) 
			Session.clear('game.'+gameId);

		// clear active game session variables
		Session.set('active.gameId', null);
		Session.set('active.userId', null);
	},

	/**
	 * Attempts to join a game with the specified accessCode. Calls the 'addPlayer' Meteor.Method internally.
	 * If successful, saves the game session using GameSession.save
	 * @async
	 * @param  {string} accessCode - the access code for the game being joined
	 * @param  {[type]} name       - the player's name
	 * @return {Promise} which succeeds if the player joins successfully, or fails otherwise.
	 *                         if successful, resolves with object { gameId: ..., playerId: ... } 
	 *                         if failed, rejects with a Meteor.error object, with error key 'game-not-found'
	 */
	join: (accessCode, name) => new Promise((resolve, reject) => {
		// request to join the game
		Meteor.call('addPlayer', accessCode, name, (err, result) => {
			if ( err ) {
				// request failed
				reject(err);
			}
			else {
				// save the game session
				GameSession.save(result.gameId, result.playerId);

				// request succeeded
				resolve(result);
			}
		});
	}),

	// useful query functions
	/**
	 * Returns a fresh copy of the Game object for the current game being played (reactive query)
	 * @return {Game} the current Game instance
	 */
	getCurrentGame: () => {
		return Games.findOne({ _id: Session.get('active.gameId') });
	},

	/**
	 * Returns the player object corresponding to the current player within the current game
	 * Returns undefined if the current user is not one of the registered players (i.e. either a host or unauthorized visitor)
	 * @return {Object} the player object for the current player, or undefined
	 */
	getCurrentPlayer: () => {
		let game = GameSession.getCurrentGame();		// reactive
		return game && _(game.players).find(p => p._id === Session.get('active.userId'));
	},

	/**
	 * Checks if the current user is the host
	 * @return {Boolean} true if the current user is the host for the current game; false otherwise
	 */
	isHost: () => { 
		let game = GameSession.getCurrentGame();		// reactive
		return !!(game && game.host && game.host._id === Session.get('active.userId'));		// force boolean result
	},

	/**
	 * Applies the specified changes to the current player object within the current game. Wrapper around Game.updatePlayer.
	 * @param  {Object} changes - flat object containing the properties to be modified in both the local object and the underlying collection. This uses the { $set: ... } Mongo call.
	 */
	updateCurrentPlayer: function(changes) {
		GameSession.getCurrentGame().updatePlayer(GameSession.getCurrentPlayer(), changes);
	}
};

// set up reactive hooks
Meteor.startup(() => {

	// reactively load the game session based on Session[active.gameId]
	Tracker.autorun(() => {
		Session.get('active.gameId');						// flag this as a dependency
		Tracker.nonreactive(() => GameSession.restore());		// flag the load process as non-reactive (don't want this triggering each time the game instance changes!)
	});

	// reactively refresh the state of the active game
	Tracker.autorun(() => {
		let game = GameSession.getCurrentGame();			// flag this as a dependency
		game && Tracker.nonreactive(() => GameController.refreshState(game));		// flag the refresh process as non-reactive (don't want this triggering needlessly)
	});

});		

