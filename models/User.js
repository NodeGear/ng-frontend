var mongoose = require('mongoose')

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var crypto = require('crypto')

var PublicKey = require('./PublicKey')
var util = require('../util')

var userSchema = schema({
	username: String,
	name: String,
	email: String,
	password: String,
	authToken: String, //wtf is authtoken??
	uid: Number,
	gid: Number,
	admin: { type: Boolean, default: false },
	tfa: {
		enabled: { type: Boolean, default: false },
		key: String,
		confirmed: { type: Boolean, default: false }
	},
	balance: { type: Number, default: 0.0 },
	stripe_customer: String,
	stripe_cards: [{
		id: String,
		name: String,
		cardholder: String,
		created: Date,
		last4: String,
		default: { type: Boolean, default: false }
	}]
});

userSchema.methods.setPassword = function(password) {
	var shasum = crypto.createHash('sha1');
	this.password = shasum.update("n©ear"+password+"<.%2€aa").digest('hex');
}

userSchema.statics.getHash = function (password) {
	var shasum = crypto.createHash('sha1');
	return shasum.update("n©ear"+password+"<.%2€aa").digest('hex');
}

userSchema.statics.taken = function (username, cb) {
	model.findOne({
		username: username
	}, function(err, user) {
		if (err) throw err;
		
		cb(user == null ? false : true)
	})
}

userSchema.statics.takenEmail = function (email, cb) {
	model.findOne({
		email: email
	}, function(err, user) {
		if (err) throw err;
		
		cb(user == null ? false : true)
	})
}

userSchema.statics.authenticate = function (token, cb) {
	model.findOne({
		authToken: token
	}, function(err, user) {
		if (err) throw err;
		
		cb(user);
	})
}

userSchema.methods.generateToken = function (cb) {
	var self = this;
	crypto.randomBytes(48, function(ex, buf) {
		self.authToken = buf.toString('hex');
		self.save(function(err) {
			cb(self.authToken)
		})
	});
}

userSchema.methods.getPublicKey = function (cb) {
	var self = this
	PublicKey.findOne({
		user: self._id
	}, function(err, key) {
		if (err) throw err;
		
		cb(key);
	})
}

userSchema.methods.getName = function () {
	return this.name.length > 0 ? this.name : this.email;
}

module.exports = model = mongoose.model('User', userSchema);