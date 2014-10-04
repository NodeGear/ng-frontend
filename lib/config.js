var fs = require('fs'),
		mailer = require('nodemailer'),
		stripe = require('stripe');

// Warning: Export TEST to enable test mode.
exports.testing = !!process.env.TEST;

try {
	var credentials = './credentials';
	if (exports.testing) {
		credentials = './credentials-test';
	}

	var credentials = require(credentials);
} catch (e) {
	console.log("\nNo credentials.js File!\n");
	process.exit(1);
}

exports.mailchimp = null;
if (!exports.testing && credentials.mailchimp) {
	exports.mailchimp = new (
		require('mailchimp-api').Mailchimp)(credentials.mailchimp
	);
}

var pub_config = require('./config.public.json');

exports.public_config = pub_config;
exports.credentials = credentials;

exports.version = require('../package.json').version;
exports.hash = 'dirty';
exports.production = process.env.NODE_ENV == "production";
exports.stripe = stripe(credentials.stripe.secret);
exports.port = process.env.PORT || credentials.port;
exports.path = __dirname;

exports.metrics = new (require('lynx'))('10.0.3.2', 8125);

exports.currency = "USD";
if (credentials.currency) {
	exports.currency = credentials.currency;
}

// Get the last git commit hash
if (process.platform.match(/^win/) === null) {
	try {
		var spawn_process = require('child_process').spawn;
		var readHash = spawn_process('git', ['rev-parse', '--short', 'HEAD']);
		readHash.stdout.on('data', function (data) {
			exports.hash = data.toString().trim();
			require('./app').app.locals.versionHash = exports.hash;
		});
	} catch (e) {
		console.log("\n~= Unable to obtain git commit hash =~\n");
	}
}

exports.configure = function (app) {
	// Pretty HTML outside production mode
	app.locals.pretty = !exports.production;
	app.locals.stripe_pub = credentials.stripe.pub;
	app.locals.cdn = (credentials.cdn && credentials.cdn.enabled) ?
		credentials.cdn.url : "";
	app.locals.version = exports.version;
	app.locals.versionHash = exports.hash;
	app.locals.production = exports.production;
	app.locals.use_analytics = credentials.use_analytics;
};

// Create SMTP transport method
if (exports.testing) {
	exports.transport_enabled = false;
} else {
	exports.transport_enabled = credentials.smtp &&
		credentials.smtp.user.length > 0;
}

exports.transport = mailer.createTransport("SMTP", {
	service: "Mandrill",
	auth: credentials.smtp,
	port: 2525 // to bypass google's restrictions on smtp ports.
});

exports.init = function () {
	if (exports.testing) return;

	var models = require('ng-models');

	models.User.findOne({
		admin: true,
		email: 'matej@matej.me'
	}).exec(function (err, admin) {
		if (!admin) {
			console.log("Creating Admin user matej@matej.me!");

			admin = new models.User({
				email: 'matej@matej.me',
				username: 'matejkramny',
				usernameLowercase: 'matejkramny',
				name: 'Matej Kramny',
				admin: true,
				is_new_pwd: true,
				updatePassword: true, // force new admin to reset pwd
				invitation_complete: true,
				email_verified: true
			});
			models.User.hashPassword('C@stawayL4bs', function (hash) {
				admin.password = hash;

				admin.save();
			});
		}
	});
};
