var mongoose = require('mongoose')
	, ObjectId = mongoose.Schema.ObjectId
	
var schema = mongoose.Schema({
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: ObjectId,
		ref: 'User'
	},
	email: String,
	code: String
});

module.exports = mongoose.model("EmailVerification", schema);