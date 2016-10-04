/**
 * client.js
 * scope: test client
 *
 * Client-side tests
 */

// Data model tests
	Tinytest.add('Data - Is the Game model available?', test => test.notEqual(typeof Game, 'undefined'));

	Tinytest.add('Data - Is the Games collection available?', test => test.notEqual(typeof Games, 'undefined'));

	Tinytest.add('Data - Game constructor', test => {
		let game = new Game({ 
			name: 'Test', 		// override default
			newkey: 1234 		// new property
		});

		// ensure game object was constructed correctly
		test.equal(game.name, 'Test', 'overriding a default property failed');
		test.equal(game.newkey, 1234, 'setting a new property failed');
		test.isUndefined(game._id, '_id property is not undefined for a newly constructed Game instance');
	});

	Tinytest.add('Data - Games insert, fetch, and transform', test => {
		let game = new Game({ name: 'Test', testcode: 'abcd1234' });
		let id = Games.insert(game);
		let refetchGame = Games.findOne({ _id: id });

		// verify that the refetched game is a Game instance, and that its properties match
		test.instanceOf(refetchGame, Game);
		test.equal(refetchGame.name, 'Test', 'game name did not match after refetch');
		test.equal(refetchGame.testcode, 'abcd1234', 'game properties did not match after refetch');
	});

	Tinytest.add('Data - Game.save', test => {
		let game = new Game({ name: 'Test', testcode: 'ola' });
		game.save();

		// verify the game instance has an id
		test.isNotUndefined(game._id, 'game after save does not have an _id');

		// verify that game properties match post-refetch
		let refetchGame = Games.findOne({ _id: game._id });
		test.equal(refetchGame._id, game._id, 'game properties did not match after save and refetch');
		test.equal(refetchGame.name, game.name, 'game properties did not match after save and refetch');
		test.equal(refetchGame.testcode, game.testcode, 'game properties did not match after save and refetch');
	});

	Tinytest.add('Data - Game.save prevented for existing instances', test => {
		let game = new Game({ name: 'Test', testcode: 'ola', _id: 'id1234' }),
			fail = false;

		try {
			game.save();
		}
		catch(err) {
			// we're expecting an error
			fail = true;
		}

		// ensure that save failed
		test.isTrue(fail, 'Game.save accepted an instance with an _id');
	});

	Tinytest.add('Data - Game.update no parameters', test => (new Game()).update());
	Tinytest.add('Data - Game.update no _id', test => {
		let game = new Game({ name: 'Test' }), 
			fail = false;

		try {
			game.update({ name: 'Testing 123', testcode: 'abcd1234' });
		}
		catch(err) {
			// we're expecting this to fail
			fail = true;
		}

		// ensure that update failed
		test.isTrue(fail, 'Game.update accepted an instance without an _id');
	});
	Tinytest.add('Data - Game.update', test => {
		let game = new Game({ name: 'Test', testcode: 'abcd' }),
			startTime = new Date();

		game.save();

		game.update({
			testcode: '1234', 			// override existing property
			newkey: 'hello world'		// add a new property
		});

		// verify that changes propagated after refetch
		let refetchGame = Games.findOne({ _id: game._id });
		test.equal(refetchGame.testcode, '1234', 'changes failed to propagate after refetch when overriding a property');
		test.equal(refetchGame.newkey, 'hello world', 'changes failed to propagate after refetch when adding a new property');

		// verify that changes were applied locally
		test.equal(game.testcode, refetchGame.testcode, 'changes failed to propagate locally when overriding a property');
		test.equal(game.newkey, refetchGame.newkey, 'changes failed to propagate locally when adding a new property');

		// verify that the modified flag was updated
		test.isTrue(game.modified >= startTime, 'modified time not updated for local instance');
		test.isTrue(refetchGame.modified >= startTime, 'modified time not updated for refetched instance');
		test.equal(game.modified, refetchGame.modified, 'modified time not the same for local and refetched instance');
	});

	Tinytest.add('Data - Game.addPlayer', test => {
		let game = new Game({ name: 'Test' }),
			startTime = new Date();
		game.save();

		// add default player should result in a new player
		let player = game.addPlayer(),
			refetchGame = Games.findOne({ _id: game._id });

		test.isNotUndefined(player, 'game.addPlayer() returned undefined');
		test.isNotUndefined(player._id, 'game.addPlayer() did not generate an id');
		test.isNotUndefined(_(game.players).find(p => p._id === player._id), 'could not find default created player in game instance');
		test.instanceOf(refetchGame, Game, 'game could not be refetched');
		test.isNotUndefined(_(refetchGame.players).find(p => p._id === player._id), 'could not find default created player in refetched game instance');

		// add specific player should retain properties
		let player2 = game.addPlayer({ name: 'Test Player', 'testcode': 'abcd1234' });
		refetchGame = Games.findOne({ _id: game._id });		// fetch a fresh copy

		test.isNotUndefined(player2, 'game.addPlayer({...}) returned undefined');
		test.isNotUndefined(player2._id, 'game.addPlayer({...}) did not generate an id');

		let p2FromGame = _(game.players).find(p => p._id === player2._id),
			p2FromRefetchGame = _(refetchGame.players).find(p => p._id === player2._id);

		test.isNotUndefined(p2FromGame, 'could not find created player in game instance');
		test.equal(p2FromGame.testcode, 'abcd1234', 'created player in game instance does not retain properties correctly');

		test.instanceOf(refetchGame, Game, 'game could not be refetched');
		test.isNotUndefined(p2FromRefetchGame, 'could not find created player in refetched game instance');
		test.equal(p2FromRefetchGame.testcode, 'abcd1234', 'created player in refetched game instance does not retain properties correctly');

		// game timestamp should be updated
		test.isTrue(game.modified >= startTime, 'modified timestamp incorrect');
		test.equal(game.modified, refetchGame.modified, 'modified timestamp differs between local and refetched instance');
	});

	Tinytest.add('Data - Game.updatePlayer no parameters', test => {
		let game = new Game({ name: 'test' }), 
			fail = false;
		game.save();

		// no parameters
		try {
			game.updatePlayer();
		}
		catch(err) {
			// expected to fail
			fail = true;
		}
		test.isTrue(fail, 'game.updatePlayer() did not throw an error for not finding a player');
	});

	Tinytest.add('Data - Game.updatePlayer', test => {
		let game = new Game({ name: 'test' }),
			refetchGame;

		game.save();

		let player1 = game.addPlayer(),
			player2 = game.addPlayer({ name: 'p2' }),
			player3 = game.addPlayer({ name: 'p3', testcode: 'control' }),
			player4 = game.addPlayer({ name: 'p4' });

		// update player2 with multiple changes
		game.updatePlayer(player2, { name: 'p2-modified', testcode: 'modified', newkey: 'hello world' });
		refetchGame = Games.findOne({ _id: game._id });

		// ensure player2 was updated correctly, and the rest were unaffected
		test.isNotUndefined(refetchGame, 'game could not be refeteched after player updated');
		let refetchp1 = _(refetchGame.players).find(p => p._id === player1._id),
			refetchp2 = _(refetchGame.players).find(p => p._id === player2._id),
			refetchp3 = _(refetchGame.players).find(p => p._id === player3._id),
			refetchp4 = _(refetchGame.players).find(p => p._id === player4._id);

		test.isNotUndefined(refetchp1, 'game could not refetch players correctly');
		test.isNotUndefined(refetchp2, 'game could not refetch players correctly');
		test.isNotUndefined(refetchp3, 'game could not refetch players correctly');
		test.isNotUndefined(refetchp4, 'game could not refetch players correctly');

		test.equal(refetchp2.name, 'p2-modified', 'modified player had incorrect properties after refetch');
		test.equal(refetchp2.testcode, 'modified', 'modified player had incorrect properties after refetch');
		test.equal(refetchp2.newkey, 'hello world', 'modified player had incorrect properties after refetch');
		test.isUndefined(refetchp2.invalidkey, 'modified player had incorrect properties after refetch');

		test.equal(player2.name, 'p2-modified', 'modified player had incorrect properties in local instance');
		test.equal(player2.testcode, 'modified', 'modified player had incorrect properties in local instance');
		test.equal(player2.newkey, 'hello world', 'modified player had incorrect properties in local instance');
		test.isUndefined(player2.invalidkey, 'modified player had incorrect properties in local instance');

		test.isUndefined(refetchp1.name, 'other players incorrectly modified after refetch');
		test.equal(refetchp3.name, 'p3', 'other players incorrectly modified after refetch');
		test.equal(refetchp4.name, 'p4', 'other players incorrectly modified after refetch');

		test.isUndefined(player1.name, 'other players incorrectly modified in local instance');
		test.equal(player3.name, 'p3', 'other players incorrectly modified in local instance');
		test.equal(player4.name, 'p4', 'other players incorrectly modified in local instance');
	});

	Tinytest.add('Data - Game.updatePlayer with no changes', test => {
		let game = new Game({ name: 'test' }),
			refetchGame,
			startTime = new Date();

		game.save();

		let player1 = game.addPlayer({ name: 'p1' }),
			player2 = game.addPlayer({ name: 'p2' }),
			player3 = game.addPlayer({ name: 'p3' }),
			player4 = game.addPlayer({ name: 'p4' });

		// update player4 with no changes
		game.updatePlayer(player4);
		refetchGame = Games.findOne({ _id: game._id });

		// ensure none of the players were modified
		test.isNotUndefined(refetchGame, 'game could not be refeteched after player updated');
		let refetchp1 = _(refetchGame.players).find(p => p._id === player1._id),
			refetchp2 = _(refetchGame.players).find(p => p._id === player2._id),
			refetchp3 = _(refetchGame.players).find(p => p._id === player3._id),
			refetchp4 = _(refetchGame.players).find(p => p._id === player4._id);

		test.isNotUndefined(refetchp1, 'game could not refetch players correctly');
		test.isNotUndefined(refetchp2, 'game could not refetch players correctly');
		test.isNotUndefined(refetchp3, 'game could not refetch players correctly');
		test.isNotUndefined(refetchp4, 'game could not refetch players correctly');

		test.equal(refetchp1.name, 'p1', 'players incorrectly modified after refetch');
		test.equal(refetchp2.name, 'p2', 'players incorrectly modified after refetch');
		test.equal(refetchp3.name, 'p3', 'players incorrectly modified after refetch');
		test.equal(refetchp4.name, 'p4', 'players incorrectly modified after refetch');

		test.equal(player1.name, 'p1', 'players incorrectly modified in local instance');
		test.equal(player2.name, 'p2', 'players incorrectly modified in local instance');
		test.equal(player3.name, 'p3', 'players incorrectly modified in local instance');
		test.equal(player4.name, 'p4', 'players incorrectly modified in local instance');

		// but game should have its modified flag bumped
		test.isTrue(game.modified >= startTime, 'modified timestamp incorrect');
		test.equal(game.modified, refetchGame.modified, 'modified timestamp differs between local and refetched instance');
	});
	
	Tinytest.add('Data - game.removePlayer no parameters', test => test.isFalse((new Game()).removePlayer()));
	Tinytest.add('Data - game.removePlayer', test => {
		let game = new Game({ name: 'Test' }),
			startTime = new Date();
			
		game.save();

		let player1 = game.addPlayer({ name: 'p1' }),
			player2 = game.addPlayer({ name: 'p2' }),
			player3 = game.addPlayer({ name: 'p3' }),
			player4 = game.addPlayer({ name: 'p4' });

		let flag = game.removePlayer(player3);
		test.isTrue(flag, 'game.removePlayer({...}) returned false');

		// make sure the refetched copy is clean
		let refetchGame = Games.findOne({ _id: game._id });

		test.isNotUndefined(refetchGame, 'game could not be refeteched after player updated');
		let refetchp1 = _(refetchGame.players).find(p => p._id === player1._id),
			refetchp2 = _(refetchGame.players).find(p => p._id === player2._id),
			refetchp3 = _(refetchGame.players).find(p => p._id === player3._id),		// should be undefined
			refetchp4 = _(refetchGame.players).find(p => p._id === player4._id);

		test.isNotUndefined(refetchp1, 'game could not refetch players correctly');
		test.isNotUndefined(refetchp2, 'game could not refetch players correctly');
		test.isUndefined(refetchp3, 'game could not refetch players correctly');		// since player3 was removed
		test.isNotUndefined(refetchp4, 'game could not refetch players correctly');

		// make sure other players' data was unaffected
		test.equal(refetchp1.name, 'p1', 'players incorrectly modified after refetch');
		test.equal(refetchp2.name, 'p2', 'players incorrectly modified after refetch');
		test.equal(refetchp4.name, 'p4', 'players incorrectly modified after refetch');

		test.equal(player1.name, 'p1', 'players incorrectly modified in local instance');
		test.equal(player2.name, 'p2', 'players incorrectly modified in local instance');
		test.equal(player4.name, 'p4', 'players incorrectly modified in local instance');

		// but game should have its modified flag bumped
		test.isTrue(game.modified >= startTime, 'modified timestamp incorrect');
		test.equal(game.modified, refetchGame.modified, 'modified timestamp differs between local and refetched instance');
	});


// GameController tests

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


// GameSession tests

	Tinytest.add('GameSession - Is the GameSession available?', test => test.notEqual(typeof GameSession, 'undefined'));

	// TODO...


// GameServer tests

	// TODO...
