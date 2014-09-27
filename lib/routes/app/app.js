var mongoose = require('mongoose'),
	models = require('ng-models'),
	fs = require('fs'),
	config = require('../../config'),
	util = require('../../util'),
	app = require('../../app'),

	log = require('./log'),
	settings = require('./settings'),
	domain = require('./domain'),
	process = require('./process'),
	environment = require('./environment');

exports.httpRouter = function (app) {
	app.all('/app/:id', getApp)
		.all('/app/:id/*', getApp);
	
	log.httpRouter(app);
};

exports.unauthorized = function (template) {
	template([
		['app', 'app/app'],
		'app/processes',
		['app/process', 'app/processModal'],
		'app/logs',
		'app/log',
		'app/logsPlaceholder',
		'app/traffic',
		'app/usage',
		'app/settings',
		'app/domains',
		'app/domain',
		'app/environment',
		'app/editEnvironment'
	]);
};

exports.router = function (app) {
	app.get('/app/:id', viewApp)

		.get('/app/:id/events', getEvents)
		.delete('/app/:id', deleteApp);
	
	domain.router(app);
	process.router(app);
	environment.router(app);

	log.router(app);
	settings.router(app);
};

function getApp (req, res, next) {
	var self = this;
	var id = req.params.id;
	
	var query = {
		user: req.user._id,
		deleted: false
	};

	try {
		query._id = mongoose.Types.ObjectId(id);
	} catch (ex) {
		// its not a mongoose id, therefore can be the name
		query.nameUrl = id;
	}
	
	// get app details
	models.App.findOne(query, function(err, app) {
		if (app === null) {
			res.status(404).end();
			return;
		}
		
		res.locals.app = app;
		
		next();
	});
}

function viewApp (req, res) {
	res.send({
		status: 200,
		app: res.locals.app
	});
}

function getEvents (req, res) {
	models.AppEvent.find({
		app: res.locals.app._id
	}).sort('-created').limit(10).exec(function(err, events) {
		res.send({
			events: events
		});
	});
}

function deleteApp (req, res) {
	// Check for running processes
	models.AppProcess.find({
		app: res.locals.app._id,
		running: true
	})
	.select('running')
	.limit(1)
	.exec(function (err, processes) {
		if (err) throw err;

		if (processes.length > 0) {
			// There are running processes. Cannot delete
			res.send({
				status: 400,
				message: "Running Processes. Stop them before deleting"
			});
			return;
		}
		
		res.locals.app.deleted = true;
		res.locals.app.save();

		models.AppDomain.remove({
			app: res.locals.app._id
		}, function(err) {
			if (err) throw err;
		});
		models.AppEnvironment.remove({
			app: res.locals.app._id
		}, function(err) {
			if (err) throw err;
		});
		models.AppEvent.remove({
			app: res.locals.app._id
		}, function(err) {
			if (err) throw err;
		});

		req.user.sendEmail("NodeGear App Manager <app_manager@nodegear.com>",
			"Application Deleted", "emails/appDeleted.jade", {
			app: res.locals.app
		});

		res.send({
			status: 200
		});
	});
}