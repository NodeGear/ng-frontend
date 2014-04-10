var mongoose = require('mongoose')
	, ObjectId = mongoose.Schema.ObjectId
	, crypto = require('crypto')
	
var schema = mongoose.Schema({
	created: {
		type: Date,
		default: Date.now
	},
	name: String,
	location: String,
	identifier: String
});

module.exports = mongoose.model("Server", schema);