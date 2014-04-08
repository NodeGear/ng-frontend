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
	code: String,
	used: {
		type: Boolean,
		default: false
	},
	usedDate: Date
});

schema.methods.generateCode = function(cb) {
	var self = this;

	crypto.randomBytes(48, function(ex, buf) {
		self.code = buf.toString('hex').substring(0, 23).toUpperCase();
		cb(self.code);
	});
};

module.exports = mongoose.model("ForgotNotification", schema);