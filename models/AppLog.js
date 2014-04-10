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
	process: {
		type: ObjectId,
		ref: 'AppProcess'
	},
	location: String,
	content: String
});

module.exports = mongoose.model("AppLog", schema);