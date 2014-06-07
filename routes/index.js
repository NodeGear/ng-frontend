var util = require('../util')
	, auth = require('./auth')
	, apps = require('./app/apps')
	//, analytics = require('./analytics')
	, profile = require('./profile/profile')
	, admin = require('./admin')
	, tickets = require('./tickets')
	, models = require('ng-models')
	, databases = require('./databases/databases')
	, ssh = require('./ssh/keys')

exports.router = function(app) {
	var templates = require('../templates')(app);
	templates.route([
		auth,
		apps,
		profile,
		tickets,
		databases,
		ssh
	]);

	templates.add('gettingStarted');
	templates.setup();

	app.get('/', layout);

	app.all('*', util.authorized);

	app.all('/admin', util.mustBeAdmin);
	app.all('/admin/*', util.mustBeAdmin);
	admin.router(app);

	// Handle HTTP reqs
	apps.httpRouter(app);

	// No HTML requests beyond this point

	app.get('*', function(req, res, next) {
		res.format({
			json: function() {
				next()
			},
			html: function() {
				res.render('layout');
			}
		});
	});

	auth.router(app);
	
	apps.router(app)
	profile.router(app)
	tickets.router(app)
	databases.router(app);
	ssh.router(app);

	app.get('/servers', getServers)
}

// webSocket routing stuff
exports.socket = function (socket) {
	apps.socket(socket);

	socket.on('watch_servers', function(data) {
		if (this.handshake.user.admin) {
			this.set('server_stats', data.watch, function(err) {
				if (err) throw err;
			});
		}
	})
	socket.on('watch_processes', function(data) {
		this.set('process_stats', data.watch, function(err) {
			if (err) throw err;
		});
	})
}
exports.socketDisconnect = function (socket) {
	apps.socketDisconnect(socket)
}

function layout (req, res) {
	if (res.locals.loggedIn) {
		res.render('layout')
	} else {
		res.render('auth');
	}
}

function getServers (req, res) {
	models.Server.find({
	}, function(err, servers) {
		if (err) throw err;

		res.send({
			status: 200,
			servers: servers
		})
	})
}