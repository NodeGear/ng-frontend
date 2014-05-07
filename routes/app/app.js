var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, app = require('../../app')

	, log = require('./log')
	, analytics = require('./analytics')
	, usage = require('./usage')
	, settings = require('./settings')
	, domain = require('./domain')
	, process = require('./process')
	, environment = require('./environment')

exports.httpRouter = function(app) {
	app.all('/app/:id', getApp)
		.all('/app/:id/*', getApp)
	
	log.httpRouter(app);
}

exports.unauthorized = function (template) {
	template([
		['app', 'app/app'],
		'app/dashboard',
		['app/process', 'app/processModal'],
		'app/logs',
		'app/log',
		'app/traffic',
		'app/usage',
		'app/settings',
		'app/domains',
		'app/domain',
		'app/environment',
		'app/editEnvironment'
	])
}

exports.router = function (app) {
	app.get('/app/:id', viewApp)

		.get('/app/:id/events', getEvents)
		.delete('/app/:id', deleteApp)
	
	domain.router(app);
	process.router(app);
	environment.router(app);

	log.router(app)
	analytics.router(app)
	usage.router(app)
	settings.router(app)
}

exports.socket = function (socket) {
	log.socket(socket);

	socket.on('subscribe_log', subscribe_log);
	socket.on('unsubscribe_log', unsubscribe_log);
}
exports.socketDisconnect = function (socket) {
	log.socketDisconnect(socket)
}

function getApp (req, res, next) {
	var self = this
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
	
	// get drone details
	models.App.findOne(query, function(err, app) {
		if (app == null) {
			res.send(404);
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
	})
}

function getEvents (req, res) {
	models.AppEvent.find({
		app: res.locals.app._id
	}).sort('-created').limit(10).exec(function(err, events) {
		res.send({
			events: events
		})
	})
}

function deleteApp (req, res) {
	// Check for running processes
	models.AppProcess.find({
		app: res.locals.app._id,
		running: true
	}).select('running').limit(1).exec(function(err, processes) {
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

		req.user.sendEmail("NodeGear App Manager <app_manager@nodegear.com>", "Application Deleted", "emails/appDeleted.jade", {
			app: res.locals.app
		});

		res.send({
			status: 200
		})
	})
}

// websocket stuff

function authorize_socket (socket, data, cb) {
	var locals = {};

	var req = {
		user: socket.handshake.user,
		params: data,
	};
	var res = {
		locals: locals,
		send: function(obj) {
			// If it got here, user supplied an invalid id..
		}
	}

	getApp(req, res, function() {
		process.getProcess(req, res, function() {
			cb(locals);
		});
	});
}

function subscribe_log (data) {
	var socket = this;

	authorize_socket(socket, data, function(locals) {
		socket.get('subscribe_log', function(err, processes) {
			if (err || !processes) {
				processes = [];
			}

			var found = false;
			var id = locals.process._id.toString();
			for (var i = 0; i < processes.length; i++) {
				if (processes[i] == id) {
					found = true;
					break;
				}
			}

			if (!found) {
				processes.push(id);
			}

			socket.set('subscribe_log', processes, function(err) {
				if (err) throw err;
			})

		});
	});
}

function unsubscribe_log (data) {
	var socket = this;

	authorize_socket(socket, data, function(locals) {
		socket.get('subscribe_log', function(err, processes) {
			if (err || !processes) {
				return;
			}

			var found = false;
			var id = locals.process._id.toString();
			for (var i = 0; i < processes.length; i++) {
				if (processes[i] == id) {
					found = true;

					// Unsubscribes here
					processes.splice(i, 1);

					break;
				}
			}

			if (!found) {
				// Not subscribed
				return;
			}

			socket.set('subscribe_log', processes, function(err) {
				if (err) throw err;
			})
		});
	});
}