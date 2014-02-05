var util = require('../util')
	, auth = require('./auth')
	, apps = require('./app/apps')
	, analytics = require('./analytics')
	, profile = require('./profile/profile')
	, admin = require('./admin')

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
	analytics.router(app)
	profile.router(app)
}

function login (req, res, next) {
	if (res.locals.loggedIn) {
		next();
	} else {
		res.render('auth');
	}
}

function viewApps (req, res) {
	res.redirect('/apps')
}

function gettingStarted (req, res) {
	res.render('gettingStarted')
}