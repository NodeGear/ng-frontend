var express = require('express')
	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
	, util = require('./util')
	, session = require('express-session')
	, MongoStore = require('connect-mongo')(session)
	, passport = require('passport')
	, auth = require('./auth')
	, config = require('./config')
	, bugsnag = require('bugsnag')
	, socketPassport = require('passport.socketio')
	, redis = require("redis")
	, backend = redis.createClient(config.credentials.redis_port, config.credentials.redis_host)
	, staticVersioning = require('./staticVersioning')
	, monitor = require('./monitor')
	, models = require('ng-models').init(mongoose, config)
	, redis_channel = require('./redis_channel')
	, bodyParser = require('body-parser');

var app = exports.app = express();

exports.backend = backend;
if (config.production) {
	require('newrelic');
	backend.auth(config.credentials.redis_key);
}

if (!process.env.NG_TEST) {
	var releaseStage = config.production ? "production" : "development";

	bugsnag.register("c0c7568710bb46d4bf14b3dad719dbbe", {
		notifyReleaseStages: ["production"],
		releaseStage: releaseStage
	});
}

exports.backend.on("error", function (err) {
	console.log("Backend Error", err);
});

mongoose.connect(config.credentials.db, config.credentials.db_options);

var sessionStore = new MongoStore({
	mongoose_connection: mongoose.connection,
	auto_reconnect: true,
	stringify: false
});

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
app.set('app version', config.version); // App version
app.set('x-powered-by', false);

app.set('view cache', config.production);

app.locals.pretty = process.env.NODE_ENV != 'production' // Pretty HTML outside production mode
app.locals.stripe_pub = config.credentials.stripe.pub;
app.locals.cdn = (config.credentials.cdn && config.credentials.cdn.enabled) ? config.credentials.cdn.url : "";
app.locals.version = config.version;
app.locals.versionHash = config.hash;

//app.use(monitor());

app.use(staticVersioning());

app.use(function(req, res, next) {
	res.set('server', 'nodegear');
	res.set('x-frame-options', 'SAMEORIGIN');
	res.set('x-xss-protection', '1; mode=block');
	next();
});

app.use(require('serve-static')(path.join(__dirname, 'public')));

app.use(require('morgan')(config.production ? 'default' : 'dev'));

app.use(bugsnag.requestHandler);
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
	resave: false
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
	
	next();
});

// routes
routes.router(app);

app.use(bugsnag.errorHandler);

var server = http.createServer(app)
server.listen(app.get('port'), function(){
	console.log('NodeGear Frontend listening on port ' + app.get('port'));
});
exports.io = io = require('socket.io').listen(server)

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