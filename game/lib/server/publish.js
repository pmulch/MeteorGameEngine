/**
 * publish.js
 * scope: server
 *
 * Manages all publications and modifications of collections
 */

// TODO: update the security policy on this collection

// publish all games to all users (for now)
Meteor.publish('games', function(accessCodeOrId) { 
	
	// fetch by id or by access code	
	if ( _(accessCodeOrId).isString() && accessCodeOrId !== '' ) {
		return Games.find({ 
			$or: [ 
				{ _id: accessCodeOrId },
				{ accessCode: accessCodeOrId.toLowerCase() }		// ensure access code is lower-case (until we make this case-insensitive)
			] 
		});
	}

	// fetch all
	return Games.find({});		// TODO: maybe restrict this if not needed?
});


// for now, allow insert / update operations, but not delete
Games.allow({
	insert: function(userId, doc) {
		return true;
	}, 
	update: function(userId, doc) {
		return true;
	},
	remove: function(userId, doc) {
		return false;
	}
});
