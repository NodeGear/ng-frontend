var util = require('../util')
	, auth = require('./auth')
	, apps = require('./app/apps')
	//, analytics = require('./analytics')
	, profile = require('./profile/profile')
	, admin = require('./admin')
	, tickets = require('./tickets')

exports.router = function(app) {
	app.get('/', login, viewApps);
	auth.router(app)
	
	app.all('/admin', util.mustBeAdmin)
	app.all('/admin/*', util.mustBeAdmin)
	admin.router(app)
	
	app.get('*', function(req, res, next) {
		res.format({
			json: function() {
				next()
			},
			html: function() {
				if (req.query.partial) {
					next()
				} else {
					res.render('layout')
				}
			}
		})
	})
	
	app.get('/gettingStarted', gettingStarted)
	
	apps.router(app)
	//analytics.router(app)
	profile.router(app)
	tickets.router(app)
}

// webSocket routing stuff
exports.socket = function (socket) {
	apps.socket(socket)
}
exports.socketDisconnect = function (socket) {
	apps.socketDisconnect(socket)
}

function login (req, res, next) {
	if (res.locals.loggedIn) {
		next();
	} else {
		res.render('auth');
	}
}

function viewApps (req, res) {
	res.render('layout')
}

function gettingStarted (req, res) {
	res.render('gettingStarted')
}