var mongoose = require('mongoose')

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var crypto = require('crypto')

var PublicKey = require('./PublicKey')
var util = require('../util')

var config = require('../config')
	, jade = require('jade')

var userSchema = schema({
	created: {
		type: Date,
		default: Date.now
	},
	username: String,
	name: String,
	email: String,
	password: String,
	uid: Number,
	gid: Number,
	admin: {
		type: Boolean,
		default: false
	},
	disabled: {
		type: Boolean,
		default: false
	},
	balance: {
		type: Number,
		default: 0.0
	},
	stripe_customer: String,
	default_payment_method: {
		type: ObjectId,
		ref: 'PaymentMethod'
	},
	tfa_enabled: {
		type: Boolean,
		default: false
	},
	tfa: {
		type: ObjectId,
		ref: 'TFA'
	}
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

userSchema.methods.sendEmail = function(from, subject, view, locals) {
	var u = this;

	if (!config.transport_enabled || !u.email) {
		return null;
	}

	var html = jade.renderFile(config.path + '/views/' + view, locals);
	
	var options = {
		from: from,
		to: u.name+" <"+u.email+">",
		subject: subject,
		html: html
	};

	config.transport.sendMail(options, function(error, response){
		if (error) {
			console.log(error);
		} else {
			console.log("Message sent: " + response.message);
		}
	});

	return true;
};

userSchema.methods.getName = function () {
	return this.name.length > 0 ? this.name : this.email;
}

module.exports = model = mongoose.model('User', userSchema);