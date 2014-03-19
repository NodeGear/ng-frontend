var fs = require('fs')
	, mailer = require('nodemailer')
	, stripe = require('stripe')

try {
	var credentials = require('./credentials')
} catch (e) {
	console.log("\nNo credentials.js File!\n")
	process.exit(1);
}

exports.version = '0.1.0';
exports.hash = '';
exports.env = process.env.NODE_ENV == "production" ? "production" : "development";
exports.transport = mailer.createTransport("Mandrill", credentials.transport)

exports.redis_key = credentials.redis_key;

// before prod. release, convert all these *secret* strings to process.env.____;
exports.stripe_keys = credentials.stripe_keys
exports.stripe = stripe(exports.stripe_keys.secret);

exports.db_options = {
	auto_reconnect: true,
	native_parser: true,
	server: {
		auto_reconnect: true
	}
};

exports.db = credentials.db;
	
exports.port = credentials.port;
exports.droneLocation = credentials.droneLocation;
exports.gitolite = credentials.gitolite;
exports.gitoliteKeys = credentials.gitoliteKeys;
exports.gitoliteConfig = credentials.gitoliteConfig;

exports.db_options = credentials.db_options;

/*
if (exports.env == "production") {
	exports.db_options.replset = {
		rs_name: "rs0"
	};
	var auth = "mongodb://nodegear:Jei4hucu5fohNgiengohgh8Pagh4fuacahQuiwee";
	exports.db = auth+"@repl1.mongoset.castawaydev.com/nodegear,"+auth+"@repl2.mongoset.castawaydev.com";
	
	exports.port = process.env.PORT || 80;
	exports.droneLocation = "/var/ng_apps/";
	exports.gitolite = "/var/ng_gitolite/";
	exports.gitoliteKeys = exports.gitolite+"keydir/";
	exports.gitoliteConfig = exports.gitolite+"conf/gitolite.conf";
} Legacy Settings */

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