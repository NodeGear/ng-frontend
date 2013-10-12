var mongoose = require('mongoose')
	, models = require('../models')
	, fs = require('fs')
	, config = require('../config')
	, drone = require('./drone')

exports.router = function (app) {
	app.get('/app/add', addApp)
		.post('/app/add', doAddApp)
		.get('/apps', getApps, viewApps)
		.get('/app/:id', getApps, viewApp)
		.get('/app/:id/install', getApps, drone.install)
		.get('/app/:id/start', getApps, drone.start)
		.get('/app/:id/stop', getApps, drone.stop)
		.get('/app/:id/restart', getApps, drone.restart)
		.get('/app/:id/delete', getApps, drone.delete)
}

function getApps (req, res, next) {
	var id = req.params.id;
	
	if (id) {
		id = mongoose.Types.ObjectId(id);
	}
	
	models.Drone.find({
		user: req.user._id
	}, function(err, drones) {
		if (err) throw err;
		
		res.locals.apps = drones;
		res.locals.app = drones[0];
		
		if (id) {
			for (var i = 0; i < drones.length; i++) {
				if (drones[i]._id.equals(id)) {
					console.log("Got it")
					res.locals.app = drones[i];
					break;
				}
			}
		}
		
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

function doAddApp (req, res) {
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

function viewApp (req, res) {
	res.render('app/apps')
}

function viewApps (req, res) {
	res.render('app/apps')
}