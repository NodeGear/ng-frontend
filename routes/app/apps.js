var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, app = require('./app')
	, server = require('../../app')

exports.httpRouter = function(_app) {
	app.httpRouter(_app);
}

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
		.post('/apps/add', doAddApp)
		.get('/apps', getApps, viewApps)
	
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
	
	var errs = [];
	
	if (!name || name.length == 0) {
		errs.push("Name Invalid");
	}
	if (!template || template.length == 0) {
		errs.push("Template Does not Exist");
	} else {
		var templates = [
			{
				name: "ghost",
				location: "git://github.com/NodeGear/Ghost.git",
				branch: '0.4.2-ng'
			},
			{
				name: "custom",
				location: req.body.custom_location,
				branch: req.body.custom_branch
			}
		];
		
		var found = false;
		for (var i = 0; i < templates.length; i++) {
			if (templates[i].name == template) {
				found = true;
				template = templates[i];
				break;
			}
		}

		if (template.location.length == 0 || template.branch.length == 0) {
			errs.push("Template Location|Branch Invalid");
		}
		
		if (!found) {
			errs.push("Template Does not Exist");
		}
	}
	
	if (errs.length) {
		res.send({
			status: 400,
			message: errs.join(', '),
			errs: errs
		})
		
		return;
	}
	
	var nameUrl = name.replace(/\W+/g, '-').trim().toLowerCase();

	var app = new models.App({
		name: name,
		nameLowercase: name.toLowerCase(),
		user: req.user._id,
		script: "index.js",
		nameUrl: nameUrl,
		location: template.location,
		branch: template.branch
	})
	app.save(function(err) {
		if (err) throw err;
		
		res.send(200, {
			status: 200,
			id: app._id,
			nameUrl: nameUrl
		})
	})
}

function viewApps (req, res) {
	res.send({ apps: res.locals.apps });
}