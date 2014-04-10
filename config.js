var fs = require('fs')
	, mailer = require('nodemailer')
	, stripe = require('stripe')

// Warning: Export NG_TEST to enable test mode.

try {
	var credentials = './credentials';
	if (process.env.NG_TEST) {
		credentials = './credentials-test';

		console.log("-- TEST MODE --")
	}

	var credentials = require(credentials)
} catch (e) {
	console.log("\nNo credentials.js File!\n")
	process.exit(1);
}

// Create SMTP transport method
if (process.env.NG_TEST) {
	exports.transport_enabled = false;
} else {
	exports.transport_enabled = credentials.smtp.user.length > 0;
}
exports.transport = mailer.createTransport("SMTP", {
	service: "Mandrill",
	auth: credentials.smtp
})

exports.version = require('./package.json').version;
exports.hash = '';
exports.env = process.env.NODE_ENV == "production" ? "production" : "development";

exports.redis_key = credentials.redis_key;

// before prod. release, convert all these *secret* strings to process.env.____;
exports.stripe_keys = credentials.stripe_keys
exports.stripe = stripe(exports.stripe_keys.secret);

exports.db = credentials.db;
exports.networkDb = credentials.networkDb;

exports.db_options = credentials.db_options;
exports.networkDb_options = credentials.networkDb_options;

exports.port = credentials.port;
exports.droneLocation = credentials.droneLocation;
exports.gitolite = credentials.gitolite;
exports.gitoliteKeys = credentials.gitoliteKeys;
exports.gitoliteConfig = credentials.gitoliteConfig;
exports.cdn = credentials.cdn;

exports.path = __dirname;
exports.tmp = "/tmp/nodegear/";

fs.exists(exports.tmp, function(exists) {
	if (!exists) {
		console.log("Creating tmp dir")
		fs.mkdir(exports.tmp, function(err) {
			if (err) throw err;
		})
	}
})
fs.exists(exports.droneLocation, function(exists) {
	if (!exists) {
		console.log("Creating drone location dir")
		fs.mkdir(exports.droneLocation, function(err) {
			if (err) throw err;
		})
	}
})