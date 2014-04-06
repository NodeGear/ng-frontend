var mongoose = require('mongoose')
	, ObjectId = mongoose.Schema.ObjectId
	, crypto = require('crypto')
	
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

schema.methods.generateCode = function(cb) {
	var self = this;

	crypto.randomBytes(3, function(ex, buf) {
		self.code = buf.toString('hex').substring(0, 5).toUpperCase();
		cb(self.code);
	});
};

module.exports = mongoose.model("EmailVerification", schema);