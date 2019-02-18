/**
 * Game View Controller
 */

import { Template } from 'meteor/templating';
import { GameSession } from './game-session';

// local parameters
let options = { 
	statePrefix: 's_',
	error404: 'error404'
};


// subscribe to the 'games' collection while this template is in use
// requires 'gameId' parameter to be set on the template
Template.game.onCreated(function() {
	let self = this,
		data = Template.currentData();

	// set options
	if ( data ) {
		if (data.statePrefix) options.statePrefix = data.statePrefix;
		if (data.error404Template) options.error404 = data.error404Template;
	}

	// run reactive code
	self.autorun(() => 
		self.subscribe(
			'games', 								// subscribe to the 'games' collection
			data.gameId,							// limit the subscription to the current gameId
			() => GameSession.load(data.gameId)		// on success, load the game (needed in case of reloads)
		)
	);
});

// helper variables used by the game template
Template.game.helpers({
	// returns the template name based on the current game state
	state: () => {
		let game = GameSession.getCurrentGame(),
			state = game && game.state;

		return state 
			? options.statePrefix + state 			// the game.state is prefixed (for namespacing), then used to look up a template
			: options.error404;						// fallback is the 404 page provided
	},

	// checks to see if the user is allowed to access this game (either host or player)
	isAllowedIn: () => !!(GameSession.isHost() || GameSession.getCurrentPlayer()),

	// general data context passed to each state view
	data: () => ({
		game: () => GameSession.getCurrentGame(),
		player: () => GameSession.getCurrentPlayer(),
		isHost: () => GameSession.isHost()
	})
});