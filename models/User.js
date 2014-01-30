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
	authToken: String,
	uid: Number,
	gid: Number
});

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

if (util.isDemo) {
	module.exports.findOne({
		email: "demo@nodecloud.co"
	}, function(err, demo) {
		if (err) throw err;
		
		if (demo == null) {
			demo = new module.exports({
				username: "demo",
				name: "NodeCloud Demonstration Account",
				email: "demo@nodecloud.co",
				password: "demo"
			})
			demo.save()
			
			// Also make some test apps...
		}
	})
}