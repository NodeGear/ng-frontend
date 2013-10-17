var util = require('../util')
	, auth = require('./auth')
	, apps = require('./app/apps')
	, analytics = require('./analytics')
	, profile = require('./profile/profile')

exports.router = function(app) {
	app.get('/', login, viewApps);
	
	auth.router(app)
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