var models = require('../../models')

exports.router = function (app) {
	app.get('/admin/apps', getApps)
		.get('/admin/app/:id', getApp, showApp)
}

function getApps (req, res) {
	models.Drone.find({}).populate('user').exec(function(err, apps) {
		res.locals.apps = apps;
		
		res.render('admin/apps')
	})
}

function getApp (req, res, next) {
	var id = req.params.id;
	
	models.Drone.findById(id).populate('user').exec(function(err, app) {
		res.locals.app = app;
		next();
	})
}

function showApp (req, res) {
	res.render('admin/app')
}