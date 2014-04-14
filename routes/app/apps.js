var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, app = require('./app')
	, server = require('../../app')

exports.unauthorized = function (_app, template) {
	// Unrestricted -- non-authorized people can access!
	template([
		{
			route: 'apps',
			view: 'app/apps'
		},
		'app/add'
	]);

	app.unauthorized(template);
}

exports.router = function (_app) {
	_app
		.post('/app/add', util.authorized, doAddApp)
		.get('/apps', util.authorized, getApps, viewApps)
	
	app.router(_app)
}

exports.socket = function (socket) {
	app.socket(socket);
}
exports.socketDisconnect = function (socket) {
	app.socketDisconnect(socket)
}

function getApps (req, res, next) {
	var self = this;
	
	req.user.getApps(function(apps) {
		res.locals.apps = apps;
		
		next();
	})
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
		var templates = ["ghost"];
		
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
	var drone = new models.App({
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
		
		res.send(200, {
			status: 200,
			id: drone._id
		})
	})
}

function viewApps (req, res) {
	res.send({ apps: res.locals.apps });
}