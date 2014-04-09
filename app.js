var express = require('express')
	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
	, util = require('./util')
	, MongoStore = require('session-mongoose')(express)
	, mailer = require('nodemailer')
	, passport = require('passport')
	, auth = require('./auth')
	, config = require('./config')
	, bugsnag = require('bugsnag')
	, socketPassport = require('passport.socketio')
	, redis = require("redis")
	, backend = redis.createClient()
	, toobusy = require('toobusy')
	, staticVersioning = require('./staticVersioning')

var app = exports.app = express();

exports.backend = backend;
if (config.env == 'production') {
	backend.auth(config.redis_key)
}

if (!process.env.NG_TEST) {
	var releaseStage = config.env;

	bugsnag.register("c0c7568710bb46d4bf14b3dad719dbbe", {
		notifyReleaseStages: ["production"],
		releaseStage: releaseStage
	});
}

exports.backend.on("error", function (err) {
	console.log("Backend Error", err);
});

if (process.platform.match(/^win/) == null) {
	try {
		var spawn_process = require('child_process').spawn
		var readHash = spawn_process('git', ['rev-parse', '--short', 'HEAD']);
		readHash.stdout.on('data', function (data) {
			config.hash = data.toString().trim();
		})
	} catch (e) {
		console.log("\n~= Unable to obtain git commit hash =~\n")
	}
}

mongoose.connect(config.db, config.db_options);
var sessionStore = new MongoStore({
	connection: mongoose.connection,
	interval: 120000
});
if (process.env.NODE_ENV == 'production') {
	// production mode
	console.log("Production");
} else {
	// development mode
	console.log("Development");
}

var db = mongoose.connection
db.on('error', console.error.bind(console, 'Mongodb Connection Error:'));
db.once('open', function callback () {
	console.log("Mongodb connection established")
});

// all environments
app.enable('trust proxy');
app.set('port', process.env.PORT || 3000); // Port
app.set('views', __dirname + '/views');
app.set('view engine', 'jade'); // Templating engine
app.set('view cache', true); // Cache views
app.set('app version', config.version); // App version
app.locals.pretty = process.env.NODE_ENV != 'production' // Pretty HTML outside production mode

// Toobusy middleware..
app.use(function(req, res, next) {
	if (process.env.NODE_ENV != 'production') {
		next();
		return;
	}

	if (toobusy()) {
		res.format({
			html: function() {
				res.status(503);
				res.render('too_busy');
			},
			json: function() {
				res.send(503, "");
			}
		});
	} else {
		next();
	}
});

app.use(bugsnag.requestHandler);
if (!process.env.NG_TEST) {
	app.use(express.logger('dev')); // Pretty log
}
app.use(express.limit('30mb')); // File upload limit
app.use(staticVersioning());
app.use(function(req, res, next) {
	res.set('X-Powered-By', 'NodeGear');
	next();
})
app.use("/", express.static(path.join(__dirname, 'public'), {
	maxAge: 7 * 24 * 60 * 60
})); // serve static files
app.use(express.bodyParser()); // Parse the request body
app.use(express.multipart());
app.use(express.cookieParser()); // Parse cookies from header
app.use(express.methodOverride());
app.use(express.session({ // Session store
	key: 'ng',
	secret: "K3hsadkasdoijqwpoie",
	store: sessionStore,
	cookie: {
		maxAge: 604800000 // 7 days in s * 10^3
	}
}));
if (!process.env.NG_TEST) {
	app.use(express.csrf()); // csrf protection
}

app.use(passport.initialize());
app.use(passport.session());

// Custom middleware
app.use(function(req, res, next) {
	// request middleware
	
	if (!process.env.NG_TEST) {
		res.locals.token = req.csrfToken();
	}
	
	// flash
	if (req.session.flash) {
		res.locals.flash = req.session.flash;
	} else {
		req.session.flash = res.locals.flash = [];
	}
	
	res.locals.emptyFlash = function () {
		req.session.flash = []
	}
	
	res.locals.user = req.user;
	res.locals.loggedIn = res.locals.user != null;
	res.locals.requiresTFA = false;
	if (res.locals.loggedIn) {
		res.locals.requiresTFA = req.user.tfa_enabled && req.session.confirmedTFA !== true;
		res.locals.loggedIn = !(res.locals.requiresTFA || !req.user.email_verified);
	}
	
	res.locals.stripe_pub = config.stripe_keys.pub;
	
	res.locals.version = config.version;
	res.locals.versionHash = config.hash;

	res.locals.cdn = (config.cdn && config.cdn.enabled) ? config.cdn.url : "";
	
	next();
});

// routes
routes.router(app);

app.use(bugsnag.errorHandler);

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler()); // Let xpress handle errors
	app.set('view cache', false); // Tell Jade not to cache views
}

var server = http.createServer(app)
server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
exports.io = io = require('socket.io').listen(server)

io.set('authorization', socketPassport.authorize({
	cookieParser: express.cookieParser,
	key: 'ng',
	secret: 'K3hsadkasdoijqwpoie',
	store: sessionStore,
	passport: passport,
	fail: function(data, message, error, accept) {
		accept(false);
	}
}))
io.set('log level', 1);

io.sockets.on('connection', function(socket) {
	routes.socket(socket)
	
	socket.on('disconnect', function() {
		routes.socketDisconnect(this)
	})
})