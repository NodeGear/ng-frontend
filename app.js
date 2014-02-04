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
	, socket = require('socket.io-client').connect('http://127.0.0.1:8999')
	, bugsnag = require('bugsnag')

var app = exports.app = express();

bugsnag.register("c0c7568710bb46d4bf14b3dad719dbbe");
exports.backend = socket;

socket.on('connect', function() {
	console.log("Backend Connected")
})

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
app.set('app version', '0.0.1'); // App version
app.locals.pretty = process.env.NODE_ENV != 'production' // Pretty HTML outside production mode

app.use(bugsnag.requestHandler);
app.use(express.logger('dev')); // Pretty log
app.use(express.limit('30mb')); // File upload limit
app.use("/", express.static(path.join(__dirname, 'public'))); // serve static files
app.use(express.bodyParser()); // Parse the request body
app.use(express.multipart());
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
		req.session.flash = res.locals.flash = [];
	}
	
	res.locals.emptyFlash = function () {
		req.session.flash = []
	}
	
	res.locals.user = req.user;
	res.locals.loggedIn = res.locals.user != null;
	
	res.locals.isDemo = util.isDemo;
	
	// navigation bar
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