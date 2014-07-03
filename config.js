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

var pub_config = require('./config.public.json');

exports.public_config = pub_config;
exports.credentials = credentials;

exports.version = require('./package.json').version;
exports.hash = 'dirty';
exports.production = process.env.NODE_ENV == "production";
exports.stripe = stripe(credentials.stripe.secret);
exports.port = process.env.PORT || credentials.port;
exports.path = __dirname;

if (process.platform.match(/^win/) == null) {
	try {
		var spawn_process = require('child_process').spawn
		var readHash = spawn_process('git', ['rev-parse', '--short', 'HEAD']);
		readHash.stdout.on('data', function (data) {
			exports.hash = data.toString().trim();
			require('./app').app.locals.versionHash = exports.hash;
		})
	} catch (e) {
		console.log("\n~= Unable to obtain git commit hash =~\n")
	}
}

exports.configure = function (app) {
	app.locals.pretty = exports.production // Pretty HTML outside production mode
	app.locals.stripe_pub = credentials.stripe.pub;
	app.locals.cdn = (credentials.cdn && credentials.cdn.enabled) ? credentials.cdn.url : "";
	app.locals.version = exports.version;
	app.locals.versionHash = exports.hash;
	app.locals.production = exports.production;
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
});