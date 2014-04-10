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
	running: {
		type: Boolean,
		default: false
	},
	server: {
		type: ObjectId,
		ref: 'Server'
	},
	restarts: {
		type: Number,
		default: 0
	}
});

module.exports = mongoose.model("AppProcess", schema);