/**
 * client.js
 * scope: test client
 *
 * Client-side tests
 */

Tinytest.add('Game - Is the Game model available?', test => test.notEqual(typeof Game, 'undefined'));

Tinytest.add('Games - Is the Games collection available?', test => test.instanceOf(Games, Mongo.Collection));


Tinytest.add('GameController - Is the GameController available?', test => test.notEqual(typeof GameController, 'undefined'));

Tinytest.add('GameController - create', test => {
	let game = GameController.create();

	// should be a Game instance, with state 'lobby' and set as active
	test.instanceOf(game, Game);
	test.equal(game.state, 'lobby', 'new game state is not lobby');
	test.isTrue(game.active, 'new game is not active');
});

Tinytest.add('GameController - reset no parameters', test => GameController.reset());
Tinytest.add('GameController - reset', test => {
	let game = GameController.create();
	game.name = 'Test'; 
	game.state = 'test-state';
	game.save();

	GameController.reset(game);

	// should be back in the lobby state, set as active
	test.equal(game.state, 'lobby', 'game state is not lobby after reset');
	test.isTrue(game.active, 'game is not active after reset');
});

Tinytest.add('GameController - end no parameters', test => GameController.end());
Tinytest.add('GameController - end', test => {
	let game = GameController.create();
	game.name = 'Test'; 
	game.save();

	GameController.end(game);

	// should be set as inactive
	test.isFalse(game.active, 'game is still active after reset');
});

Tinytest.add('GameController - setStates no parameters', test => GameController.setStates());
Tinytest.add('GameController - setStates', test => {
	GameController.setStates({
		t1: () => true
	});

	// check if the 't1' state exists
	test.isTrue('t1' in GameController._states, 'setStates failed to add the test state');
});

Tinytest.add('GameController - getState no parameters', test => GameController.getState());
Tinytest.add('GameController - getState', test => {
	// lobby and end states must have a handler (by default)
	test.equal(typeof GameController.getState('lobby'), 'function', 'lobby state did not have a handler');
	test.equal(typeof GameController.getState('end'), 'function', 'end state did not have a handler');

	// see if a new state is properly retrieved
	GameController.setStates({ t2: () => true });
	test.equal(typeof GameController.getState('t2'), 'function', 'newly added state handler could not be retrieved');
});

Tinytest.add('GameController - refreshState no parameters', test => GameController.refreshState());
Tinytest.addAsync('GameController - refreshState', (test, complete) => {
	let executed = false, 
		timeout = false;

	GameController.setStates({
		t3: () => !timeout && (executed = true) && complete()
	});

	// transition a game through the test state
	let game = GameController.create();
	game.name = 'Test';
	game.save();
	game.update({state: 't3'});

	GameController.refreshState(game);

	// the flag must be set
	Meteor.setTimeout(() => !executed && (timeout = true) && test.exception(new Error('state handler failed to execute within 1s')), 1000);
});
Tinytest.add('GameController - refreshState invalid or unknown state', test => {
	GameController.setStates({ invalid: 1234 });

	let game = GameController.create();
	game.name = 'Test';
	game.save();

	// should not throw exceptions for unknown state
	game.update({state: 'unknown'});
	GameController.refreshState(game);

	// should not throw exceptions for invalid state handlers
	game.update({state: 'invalid'});
	GameController.refreshState(game);
});

Tinytest.add('GameController - isReady no parameters', test => GameController.isReady());
Tinytest.add('GameController - isReady', test => {
	let game = GameController.create();
	game.name = 'Test';
	game.save();

	// game with no players should not be ready
	test.isFalse(GameController.isReady(game), 'game with no players said it is ready');

	let player1 = game.addPlayer({ name: 'test player 1' });
	let player2 = game.addPlayer({ name: 'test player 2' });

	// game with a player that's not ready should not be ready
	test.isFalse(GameController.isReady(game), 'game with both players not ready said it is ready');

	game.updatePlayer(player1, { isReady: true });
	test.isFalse(GameController.isReady(game), 'game with one player not ready said it is ready');

	// game with both players ready should be ready
	game.updatePlayer(player2, { isReady: true });
	test.isTrue(GameController.isReady(game), 'game with both players ready said it is not ready');
});



Tinytest.add('GameSession - Is the GameSession available?', test => test.notEqual(typeof GameSession, 'undefined'));
Tinytest.add('GameSession - Does GameSession.load return undefined if no active game?', test => test.isUndefined(GameSession.load()));

