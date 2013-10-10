var express = require('express')
	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
	, util = require('./util')
	, MongoStore = require('connect-mongo')(express)
	, mailer = require('nodemailer')
	, passport = require('passport')
	, auth = require('./auth')

//var bugsnag = require("bugsnag");
//bugsnag.register("6c73b59b8d37503c8e8a70d67613d067", {
//	releaseStage: process.env.NODE_ENV == "production" ? "production" : "development",
//	notifyReleaseStages: ['production'],
//	appVersion: '0.2.0'
//})

// Create SMTP transport method
//var transport = mailer.createTransport("sendgrid", {
//	auth: {
//		user: "matej",
//		pass: "Ye1aeph9eex2eghein3ve4foh6aih5"
//	}
//})
//exports.getTransport = function() {
//	return transport;
//}

var app = exports.app = express();

var sessionStore; // session stored in database
if (process.env.NODE_ENV == 'production') {
	// production mode
	
	// In short, this will ensure a unique database for each environment
	var mode = process.env.NODE_MODE;
	if (mode == "dev" || mode == "staging") {
		mode = "-"+mode;
	} else {
		mode = "";
	}
	
	console.log("Production, mode "+mode);
	var db = "mongodb://nodecloud:Jei4hucu5fohNgiengohgh8Pagh4fuacahQuiwee@127.0.0.1/nodecloud"+mode;
	mongoose.connect(db, {auto_reconnect: true, native_parser: true});
	sessionStore = new MongoStore({
		url: db
	});
} else {
	// development mode
	console.log("Development");
	var db = "mongodb://127.0.0.1/nodecloud";
	mongoose.connect(db, {auto_reconnect: true, native_parser: true});
	sessionStore = new MongoStore({
		url: db
	});
}

// all environments
app.enable('trust proxy');
app.set('port', process.env.PORT || 3000); // Port
app.set('views', __dirname + '/views');
app.set('view engine', 'jade'); // Templating engine
app.set('view cache', true); // Cache views
app.set('app version', '0.0.1'); // App version
app.locals.pretty = process.env.NODE_ENV != 'production' // Pretty HTML outside production mode

app.use(express.logger('dev')); // Pretty log
app.use(express.limit('25mb')); // File upload limit
app.use("/", express.static(path.join(__dirname, 'public'))); // serve static files
app.use(express.bodyParser()); // Parse the request body
app.use(express.cookieParser()); // Parse cookies from header
app.use(express.methodOverride());
app.use(express.session({ // Session store
	secret: "K3hsadkasdoijqwpoie",
	store: sessionStore,
	cookie: {
		maxAge: 604800000 // 7 days in s * 10^3
	}
}));
app.use(express.csrf()); // csrf protection

app.use(passport.initialize());
app.use(passport.session());

// Custom middleware
app.use(function(req, res, next) {
	// request middleware
	
	res.locals.token = req.csrfToken();
	
	// flash
	if (req.session.flash) {
		res.locals.flash = req.session.flash;
	} else {
		res.locals.flash = [];
	}
	
	req.session.flash = [];
	
	// TODO maybe put req.user into res.locals.user
	res.locals.user = req.user;
	res.locals.loggedIn = res.locals.user != null;
	
	// navigation bar
	next();
});

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler()); // Let xpress handle errors
	app.set('view cache', false); // Tell Jade not to cache views
}

var server = http.createServer(app)
server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

// routes
routes.router(app);