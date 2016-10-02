/**
 * utils.js
 * scope: client and server
 *
 * Common utility functions
 */

 ID = {
 	// generates a new Mongo-style unique ID and returns the string value
 	generate: function() {
 		return new Mongo.ObjectID()._str;		
 	}
 };
