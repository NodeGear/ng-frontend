var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, app = require('./app')
	, server = require('../../app')
	, async = require('async')

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
				name: 'ghost',
				location: 'git://github.com/NodeGear/ghost-dist.git',
				branch: 'master',
				command: '',
				image: ''
			},
			{
				name: 'custom',
				command: '',
				image: '',
				location: req.body.custom_location,
				branch: req.body.custom_branch
			},
			//{
			//	name: 'docker',
			//	command: req.body.docker ? req.body.docker.command : null,
			//	image: req.body.docker ? req.body.docker.image : null,
			//	location: '',
			//	branch: ''
			//}
		];
		
		var found = false;
		for (var i = 0; i < templates.length; i++) {
			if (templates[i].name == template) {
				found = true;
				template = templates[i];
				break;
			}
		}

		//if (template.name == 'docker' && (template.command.length == 0 || template.image.length == 0)) {
		//}

		if (/*template.name != 'docker' && */(template.location.length == 0 || template.branch.length == 0)) {
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
	
	// try to guess available url names. Goes up to ten, if not available it uses the app id.
	var attempt = 0;
	var nameUrl = name.replace(/\W+/g, '-').trim().toLowerCase();
	async.retry(10, function (cb, results) {
		var url = nameUrl;
		if (attempt++ > 0) {
			url += '-'+attempt;
		}

		models.App.findOne({
			nameUrl: url,
			user: req.user._id
		}).select('nameUrl').exec(function (err, existingURL) {
			if (existingURL) {
				return cb(true);
			}

			cb(null, url);
		});
	}, function (err, results) {
		var url = '';
		if (!err) {
			url = results;
		}

		var app = new models.App({
			name: name,
			app_type: template.name == 'docker' ? 'docker' : 'node',
			nameLowercase: name.toLowerCase(),
			user: req.user._id,
			script: "index.js",
			nameUrl: url,
			location: template.location,
			branch: template.branch,
			docker: {
				command: template.command,
				image: template.image
			}
		});
		
		if (err) {
			app.nameUrl = app._id.toString();
		}

		app.save(function(err) {
			if (err) throw err;
			
			res.send(200, {
				status: 200,
				id: app._id,
				nameUrl: app.nameUrl
			});
		});
	});
}

function viewApps (req, res) {
	async.map(res.locals.apps, function(app, cb) {
		var _app = app.toObject();

		models.AppProcess.find({
			app: _app._id,
			deleted: false
		}).select('running').exec(function(err, processes) {
			if (err) throw err;

			var running = 0, stopped = 0;

			for (var i = 0; i < processes.length; i++) {
				if (processes[i].running) {
					running++;
				} else {
					stopped++;
				}
			}
			_app.running = running;
			_app.stopped = stopped;

			cb(null, _app);
		})
	}, function(err, apps) {
		res.send({ apps: apps });
	})
}