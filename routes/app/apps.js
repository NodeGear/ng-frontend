var mongoose = require('mongoose')
	, models = require('../../models')
	, fs = require('fs')
	, config = require('../../config')
	, drone = require('./drone')
	, util = require('../../util')
	, app = require('./app')

exports.router = function (_app) {
	_app.get('/app/add', util.authorized, addApp)
		.post('/app/add', util.authorized, doAddApp)
		.get('/apps', util.authorized, getApps, viewApps)
	
	app.router(_app)
}

function getApps (req, res, next) {
	var self = this;
	
	models.Drone.getDronesByUserId(req.user._id, function(drones) {
		res.locals.apps = drones;
		
		next();
	})
}

function addApp (req, res) {
	res.render('app/add')
}

function doAddApp (req, res) {
	if (util.isDemo) {
		res.redirect('back')
		return;
	}
	
	var name = req.body.name;
	var drone = new models.Drone({
		name: name,
		isInstalled: false,
		user: req.user._id
	})
	
	// Tar
	var up = req.files.upload;
	
	fs.readFile(up.path, function (err, data) {
		var path = 'upload' + Date.now() + '.tar.gz';
		fs.writeFile(config.droneLocation + path, data, function (err) {
			if (err) throw err;
			
			drone.location = path;
			drone.save();
			res.redirect('/apps');
		});
	})
}

function viewApps (req, res) {
	if (req.query.partial)
		res.render('app/apps')
	else
		res.send({ apps: res.locals.apps })
	
}