var mongoose = require('mongoose')
	, models = require('../../models')
	, fs = require('fs')
	, config = require('../../config')
	, drone = require('./drone')
	, util = require('../../util')
	, log = require('./log')
	, analytics = require('./analytics')
	, usage = require('./usage')
	
exports.router = function (app) {
	app.get('/app/:id', util.authorized, getApp)
		.get('/app/:id/*', util.authorized, getApp)
	
		.get('/app/:id', viewApp)
		.get('/app/:id/install', drone.install)
		.get('/app/:id/start', drone.start)
		.get('/app/:id/stop', drone.stop)
		.get('/app/:id/restart', drone.restart)
		.get('/app/:id/delete', drone.delete)
	
	log.router(app)
	analytics.router(app)
	usage.router(app)
}

function getApp (req, res, next) {
	var self = this
	var id = req.params.id;
	
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (ex) {
		res.redirect('/apps')
		return;
	}
	
	// get drone details
	models.Drone.getDroneById(id, function(drone) {
		res.locals.app = drone
		
		res.locals.app.logs.reverse()
		
		drone.pullDroneDetails(function(details) {
			res.locals.usage = details.usage
			res.locals.log = details.log
			next()
		})
	});
}

function viewApp (req, res) {
	res.render('app/app')
}
