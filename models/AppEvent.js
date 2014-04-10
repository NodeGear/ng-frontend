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
	name: String, //e.g. Restart
	message: String, //e.g. App restarted <a href="loglink">log</a>
});

module.exports = mongoose.model("AppEvent", schema);