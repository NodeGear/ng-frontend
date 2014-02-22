var mongoose = require('mongoose')
	, models = require('../../models')
	, fs = require('fs')
	, config = require('../../config')
	, drone = require('./drone')
	, util = require('../../util')
	, log = require('./log')
	, analytics = require('./analytics')
	, usage = require('./usage')
	, settings = require('./settings')
	
exports.router = function (app) {
	app.get('/app', util.authorized, viewApp)
	app.all('/app/:id', util.authorized, getApp)
		.all('/app/:id/*', util.authorized, getApp)
	
		.get('/app/:id', viewApp)
		.get('/app/:id/dashboard', viewDashboard)
		.get('/app/:id/install', drone.install)
		.get('/app/:id/start', drone.start)
		.get('/app/:id/stop', drone.stop)
		.get('/app/:id/restart', drone.restart)
		.get('/app/:id/delete', drone.delete)
		.put('/app/:id/scale', drone.scale)
	
	log.router(app)
	analytics.router(app)
	usage.router(app)
	settings.router(app)
}

exports.socket = function (socket) {
	log.socket(socket)
}
exports.socketDisconnect = function (socket) {
	log.socketDisconnect(socket)
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
		if (drone == null || (req.user.admin != true && !drone.user.equals(req.user._id))) {
			res.send(404);
			return;
		}
		
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
	if (req.query.partial) {
		res.render('app/app')
		return;
	}
	
	res.send({
		app: res.locals.app,
		log: res.locals.log,
		usage: res.locals.usage
	})
}

function viewDashboard (req, res) {
	res.render('app/dashboard')
}
