var mongoose = require('mongoose')
	, ObjectId = mongoose.Schema.ObjectId
	, crypto = require('crypto')
	
var schema = mongoose.Schema({
	created: {
		type: Date,
		default: Date.now
	},
	app: {
		type: ObjectId,
		ref: 'App'
	},
	name: String,
	value: String
});

module.exports = mongoose.model("AppEnvironment", schema);