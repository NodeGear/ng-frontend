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
	domain: String,
	tld: String,
	is_subdomain: {
		type: Boolean,
		default: false
	}
});

module.exports = mongoose.model("AppDomain", schema);