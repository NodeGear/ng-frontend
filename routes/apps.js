var mongoose = require('mongoose')
	, models = require('../models')
	, fs = require('fs')
	, config = require('../config')

exports.router = function (app) {
	app.get('/app/add', addApp)
		.post('/app/add', doAddApp)
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

function doAddApp (req, res) {
	var name = req.body.name;
	var drone = new models.Drone({
		name: name,
		isInstalled: false
	})
	
	// Tar
	var up = req.files.upload;
	console.log(up)
	
	fs.readFile(up.path, function (err, data) {
		var path = 'upload' + Date.now() + '.tar.gz';
		fs.writeFile(config.droneLocation + path, data, function (err) {
			if (err) throw err;
			
			drone.location = path;
			drone.save();
			res.redirect('/apps')
		});
	})
}

function viewApp (req, res) {
	res.render('app/apps')
}

function viewApps (req, res) {
	res.render('app/apps')
}