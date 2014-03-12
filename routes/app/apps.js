var mongoose = require('mongoose')
	, models = require('../../models')
	, fs = require('fs')
	, config = require('../../config')
	, drone = require('./drone')
	, util = require('../../util')
	, app = require('./app')
	, server = require('../../app')

exports.router = function (_app) {
	_app.get('/app/add', util.authorized, addApp)
		.post('/app/add', util.authorized, doAddApp)
		.get('/apps', util.authorized, getApps, viewApps)
	
	app.router(_app)
}

exports.socket = function (socket) {
	app.socket(socket)
}
exports.socketDisconnect = function (socket) {
	app.socketDisconnect(socket)
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
	var name = req.body.name;
	var template = req.body.template;
	var subdomain = req.body.subdomain;
	
	var errs = [];
	
	if (!name || name.length == 0) {
		errs.push("Name Empty");
	}
	if (!template || template.length == 0) {
		errs.push("Template Does not Exist");
	} else {
		var templates = ["ghost", "apostrophe"];
		
		var found = false;
		for (var i = 0; i < templates.length; i++) {
			if (templates[i] == template) {
				found = true;
				break;
			}
		}
		
		if (!found) {
			errs.push("Template Does not Exist");
		}
	}
	if (!subdomain || subdomain.length == 0) {
		errs.push("Subdomain is Required");
	}
	
	if (errs.length) {
		res.format({
			json: function() {
				res.send({
					status: 400,
					message: errs.join(', '),
					errs: errs
				})
			},
			html: function() {
				res.redirect('/app/add');
			}
		})
		
		return;
	}
	
	// Create a new drone..
	var drone = new models.Drone({
		name: name,
		user: req.user._id,
		env: [{
			name: "DOMAIN",
			value: "http://"+subdomain+".app.nodegear.com/"
		}],
		subdomain: subdomain,
		script: "index.js",
		isInstalled: false,
		isRunning: false
	})
	drone.save(function(err) {
		if (err) throw err;
		
		server.backend.publish("app_create", JSON.stringify({
			id: drone._id,
			template: template
		}));
		
		res.send(200, {})
	})
}

function viewApps (req, res) {
	if (req.query.partial)
		res.render('app/apps')
	else
		res.send({ apps: res.locals.apps });
}