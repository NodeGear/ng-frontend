var config = require('./config');

var newrelic = {
	getBrowserTimingHeader: function () {}
};
/* istanbul ignore if */
if (config.production && config.credentials.use_analytics) {
	newrelic = require('newrelic');
}

var express = require('express')
	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
	, util = require('./util')
	, session = require('express-session')
	, RedisStore = require('connect-redis')(session)
	, passport = require('passport')
	, auth = require('./auth')
	, bugsnag = require('bugsnag')
	, socketPassport = require('passport.socketio')
	, redis = require("redis")
	, backend = redis.createClient(config.credentials.redis_port, config.credentials.redis_host)
	, staticVersioning = require('./staticVersioning')
	, monitor = require('./monitor')
	, models = require('ng-models').init(mongoose, config)
	, redis_channel = require('./redis_channel')
	, bodyParser = require('body-parser')
	, pretend = require('./pretend');

var app = exports.app = express();

exports.backend = backend;
if (config.production) {
	backend.auth(config.credentials.redis_key);
}

var releaseStage = config.production ? "production" : "development";

bugsnag.register({
	apiKey: config.credentials.bugsnag_key,
	notifyReleaseStages: ["production"],
	releaseStage: releaseStage,
	autoNotify: config.testing == false,
	onUncaughtError: function () {}
});

exports.backend.on("error", function (err) {
	console.log("Redis Backend Error", err);
});

if (!mongoose.connection.readyState) {
	mongoose.connect(config.credentials.db, config.credentials.db_options);
}

var sessionStore = new RedisStore({
	host: config.credentials.redis_host,
	port: config.credentials.redis_port,
	ttl: 604800000,
	pass: config.credentials.redis_key
});

var db = mongoose.connection
db.on('error', console.error.bind(console, 'Mongodb Connection Error:'));
db.once('open', function callback () {
	if (!config.testing) console.log("Mongodb connection established")
});

// all environments
app.enable('trust proxy');
app.set('port', process.env.PORT || 3000); // Port
app.set('views', __dirname + '/views');
app.set('view engine', 'jade'); // Templating engine
app.set('app version', config.version); // App version
app.set('x-powered-by', false);

app.set('view cache', config.production);

app.locals.newrelic = newrelic;
config.configure(app);

//app.use(monitor());

app.use(staticVersioning());

app.use(function(req, res, next) {
	res.set('server', 'nodegear');
	res.set('x-frame-options', 'SAMEORIGIN');
	res.set('x-xss-protection', '1; mode=block');
	next();
});

app.use(require('serve-static')(path.join(__dirname, '..', 'dist')));

if (!config.testing) {
	// Silence morgan when testing
	app.use(require('morgan')(config.production ? 'combined' : 'dev'));
	app.use(bugsnag.requestHandler);
}

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(require('cookie-parser')());
app.use(session({
	secret: "K3hsadkasdoijqwpoie",
	name: 'ng',
	store: sessionStore,
	proxy: true,
	saveUninitialized: false,
	resave: false,
	cookie: {
		secure: config.credentials.is_ssl,
		maxAge: 604800000
	}
}));

app.use(passport.initialize());
app.use(passport.session());

// Custom middleware
app.use(function(req, res, next) {
	res.locals.user = req.user;
	res.locals.loggedIn = res.locals.user != null;
	res.locals.requiresTFA = false;
	if (res.locals.loggedIn) {
		res.locals.requiresTFA = req.user.tfa_enabled && req.session.confirmedTFA !== true;
		res.locals.loggedIn = !(res.locals.requiresTFA || !req.user.email_verified || req.session.passwordUpdateRequired);
	}

	if (req.user) {
		req.session.lastAccess = Date.now();
		if (req.session.ip != req.ip) {
			req.session.ip = req.ip;
		}
		if (!req.session.ips || req.session.ips.length != req.ips.length) {
			req.session.ips = req.ips;
		}
	}

	next();
});

// Allow admins to look like another user.
app.use(pretend());

// routes
routes.router(app);

app.use(bugsnag.errorHandler);

if (config.testing) {
	return;
}

var server = http.createServer(app)
server.listen(app.get('port'), function(){
	console.log('NodeGear Frontend listening on port ' + app.get('port'));
});
exports.io = io = require('socket.io').listen(server)

config.init();

io.use(socketPassport.authorize({
	cookieParser: require('cookie-parser'),
	key: 'ng',
	secret: 'K3hsadkasdoijqwpoie',
	store: sessionStore,
	passport: passport,
	fail: function(data, message, error, accept) {
		accept(false);
	}
}))

io.of('/process_log').on('connection', function(socket) {
	socket.on('subscribe_log', function (data) {
		this.join(data.pid);
	});
	socket.on('unsubscribe_log', function (data) {
		for (var i = 0; i < this.rooms.length; i++) {
			if (this.rooms[i] == data.pid) {
				this.rooms.splice(i, 1);
				break;
			}
		}
	})
})