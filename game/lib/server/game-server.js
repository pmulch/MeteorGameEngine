/**
 * game-server.js
 * scope: server
 *
 * Meteor Server Methods for management of the Game session
 */

Meteor.methods({
	/**
	 * Adds a new player with the specified name to the game with the specified accessCode.
	 * Can only add players to games that are active and in the lobby state.
	 * @param {string} accessCode - the access code for the Game instance
	 * @param {string} name - optional, 
	 * @return {string} the id of the player that was added
	 * @throws {game-not-found} If no active game exists with the specified acccessCode in the lobby state
	 */
	addPlayer: function(accessCode, name) {
		
		// find the game instance
		let game = _(accessCode).isString() && Games.findOne({ accessCode: accessCode, active: true, state: 'lobby' });		// can only join games if in 'lobby' state
		
		if ( !game ) 
			throw new Meteor.Error('game-not-found', 'No active game in the lobby state was found with the specified accessCode');

		// add the player to the game
		let player = game.addPlayer({ name: name });
	
		// return the player id
		return {
			gameId: game._id,
			playerId: player._id
		};
	},

	/**
	 * @param  {string} accessCode - the access code for the Game instance
	 * @return {Boolean} true if the accessCode is unique, false otherwise
	 */
	isAccessCodeUnique: function(accessCode) {
		// check if another game instance exists with the specified access code
		return _(accessCode).isString() && Games.find({ accessCode: accessCode, active: true }).count() === 0;
	}
});
