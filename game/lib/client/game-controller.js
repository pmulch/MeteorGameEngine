/**
 * game-controller.js
 * scope: client
 *
 * Manages the game state machine for a game instance
 */

/**
 * Creates and manages Game instances and the game state machine
 * @type {Object}
 */
GameController = {

	_states: {
		// default states
		lobby: (game) => !game.active && game.update({ active: true }),
		end: (game) => true 		// do nothing
	},

	/**
	 * Creates and returns a new game instance with default settings and specified overrides
	 * @param {object} overrides - properties that should be overridden in the Game instance
	 * @return {Game} new game instance with default settings
	 */
	create: (overrides) => {
		return _(new Game({
			state: 'lobby',
			active: true,				// allow this game to be joined / resumed
			host: { _id: Random.id() }	// will use this to uniquely identify the host machine
		})).extend(overrides);
	},

	/**
	 * Automatically generates a unique 4-character access code for the game instance provided and saves changes
	 * @async
	 * @param  {Game} game - the game instance to be modified
	 * @return {Promise} which resolves with the game instance once complete, or rejects with an error if unexpectedly failed
	 */
	generateAccessCode: (game) => new Promise((resolve, reject) => {
		if (!(game instanceof Game))
			reject({ error: 'invalid-parameters', details: 'The game parameter was not a valid Game instance.' });

		Meteor.call('getUniqueAccessCode', (err, result) => {
			if ( err )
				reject(err);
			else {
				// set the access code for the game, and resolve
				game.update({ accessCode: result });
				resolve(game);
			}
		});
	}),

	/**
	 * Resets the game to the initial state (lobby)
	 * @param  {Game} game - the Game instance to reset
	 */
	reset: (game) => {
		if (!(game instanceof Game)) return;

		// mark each player as not ready
		_(game.players).each(p => game.updatePlayer(p, { isReady: false }));

		// set game to lobby state and ensure it is active
		// and reset end-game results
		game.update({
			state: 'lobby',
			active: true
		});
	},

	/**
	 * End the game and flag it as inactive
	 * @param  {Game} game - the Game instance to end
	 */
	end: (game) => game instanceof Game && game.update({ active: false }),


	// Game state management
	/**
	 * Updates the game state machine based on the states specified in the dictionary
	 * @param  {Object} states - a dictionary of { stateKey: string, handlerFunction: game => () }
	 */
	setStates: (states) => {
		_(GameController._states).extend(states);
	},

	/**
	 * Returns the handler function for the specified state key.
	 * If the specified stateKey doesn't exist, returns undefined
	 * @param  {String} stateKey - the key representing the state whose handler is to be fetched
	 * @return {Function} the handler function, or undefined
	 */
	getState: (stateKey) => {
		return GameController._states[stateKey];
	},

	/**
	 * Refreshes the game state, called internally any time the game object changes.
	 * @param  {Game} game - the Game instance to be refreshed
	 */
	refreshState: (game) => {
		if (!(game instanceof Game)) return;
		
		// find the game state key within the defined states
		let stateFn = GameController.getState(game.state);

		// attempt to execute the state handler function
		if ( typeof stateFn === 'function' )
			stateFn(game);		// TODO: add better error handling here
	},

	/**
	 * Checks to see if a game is ready to begin based on each player indicating they are ready
	 * @param  {Game} game - the Game instance being checked
	 * @return {Boolean} true if the game is ready to begin, false otherwise
	 */
	isReady: (game) => game && game.players && game.players.length > 0 && _(game.players).every(p => p.isReady)	
		// verify that there is at least one player, and that all players are ready
	
};

