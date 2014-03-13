var fs = require('fs')
	, mailer = require('nodemailer')
	, stripe = require('stripe')

exports.version = '0.0.5';
exports.hash = '';
exports.env = process.env.NODE_ENV == "production" ? "production" : "development";
exports.transport = mailer.createTransport("Mandrill", {
	auth: {
		user: "matej@matej.me",
		pass: "eELIT9FIJIU52NaWvrMrPg"
	}
})

exports.redis_key = "ahShii3ahyoo0OhJa1ooG4yoosee8me9EvahW0ae";

// before prod. release, convert all these *secret* strings to process.env.____;
exports.stripe_keys = {
	pub: process.env.STRIPE_PUB || "pk_test_ntWWvmk133nUhBqeMp81RsM7",
	secret: process.env.STRIPE_SECRET || "sk_test_SItZ2XOerPoDSVwPC89VI97B"
}
exports.stripe = stripe(exports.stripe_keys.secret);

exports.db_options = {
	auto_reconnect: true,
	native_parser: true,
	server: {
		auto_reconnect: true
	}
};
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
} else {
	exports.db = "mongodb://127.0.0.1/nodegear";
	
	exports.port = process.env.PORT || 3000;
	exports.droneLocation = process.env.HOME+"/ng_apps/";
	exports.gitolite = process.env.HOME+"/dev/nodegear-gitolite/";
	exports.gitoliteKeys = exports.gitolite+"keydir/";
	exports.gitoliteConfig = exports.gitolite+"conf/gitolite.conf";
}

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