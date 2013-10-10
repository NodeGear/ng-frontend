var mongoose = require('mongoose')
	, models = require('../models')

exports.router = function (app) {
	app.get('/app/add', addApp)
		.get('/app/:id', getApps, viewApp)
		.get('/apps', getApps, viewApps)
}

function getApps (req, res, next) {
	var id = req.params.id;
	var query = {
	}
	
	if (id) {
		query._id = mongoose.Types.ObjectId(id);
	}
	
	models.Drone.find(query, function(err, drones) {
		if (err) throw err;
		
		res.locals.apps = drones;
		res.locals.app = drones[0];
		
		if (drones.length == 0) {
			res.redirect('/app/add');
			return;
		}
		
		next();
	})
}

function addApp (req, res) {
	res.render('app/add')
}

function viewApp (req, res) {
	res.render('app/app')
}

function viewApps (req, res) {
	res.render('app/apps')
}