var mongoose = require('mongoose')

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;
var crypto = require('crypto')

var PublicKey = require('./PublicKey')
var util = require('../util')

var config = require('../config')
	, jade = require('jade')
	, exec = require('child_process').exec
	, async = require('async')
	, bugsnag = require('bugsnag')

var userSchema = schema({
	created: {
		type: Date,
		default: Date.now
	},
	username: String,
	usernameLowercase: String,
	name: String,
	email: String,
	email_verified: {
		type: Boolean,
		default: false
	},
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
	module.exports.findOne({
		usernameLowercase: username.toLowerCase()
	}, function(err, user) {
		if (err) throw err;

		var taken = (user == null) ? false : true;
		cb(taken)
	})
}

userSchema.statics.takenEmail = function (email, cb) {
	module.exports.findOne({
		email: email.toLowerCase()
	}, function(err, user) {
		if (err) throw err;

		var taken = (user == null) ? false : true;
		cb(taken)
	})
}

userSchema.statics.authenticate = function (token, cb) {
	module.exports.findOne({
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
};

userSchema.methods.createIDs = function() {
	var user = this;

	var script = config.path+"/scripts/createUser.sh "+config.droneLocation+" "+user._id;
	
	console.log("Running CreateID", script);

	var run = exec(script)
	run.stdout.on('data', function(data) {
		console.log(data)
	})
	run.stderr.on('data', function(data) {
		console.log(data)
	})
	
	run.on('close', function(code) {
		// Get the ID and GID
		async.parallel({
			uid: function(done) {
				var uid = exec("id -u "+user._id)
				uid.stdout.on("data", function(data) {
					console.log("UID: "+parseInt(data));
					done(null, parseInt(data))
				});
			},
			gid: function(done) {
				var gid = exec("id -g "+user._id)
				gid.stdout.on("data", function(data) {
					console.log("GID: "+parseInt(data));
					done(null, parseInt(data));
				})
			}
		}, function(err, results) {
			if (results.uid < 500 || results.gid < 500) {
				console.log("UID|GID < 500, dangerous by my standards..");
				bugsnag.notify("UID|GID < 500, dangerous by my standards..")
				return;
			}

			user.uid = results.uid;
			user.gid = results.gid;
			user.save();
		})
	})
};

module.exports = mongoose.model('User', userSchema);