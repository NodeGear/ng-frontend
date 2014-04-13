var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, log = require('./log')
	, analytics = require('./analytics')
	, usage = require('./usage')
	, settings = require('./settings')
	, app = require('../../app')
	
exports.router = function (app) {
	app.get('/app', util.authorized, viewApp)
	app.all('/app/:id', util.authorized, getApp)
		.all('/app/:id/*', util.authorized, getApp)
	
		.get('/app/:id', viewApp)
		.get('/app/:id/dashboard', viewDashboard)

		.get('/app/:id/processes', getProcesses)
		.get('/app/:id/process', viewProcessModal)
		.get('/app/:id/process/:pid', getProcess, viewProcess)
		.put('/app/:id/process/:pid', getProcess, saveProcess)
		.post('/app/:id/process/:pid/start', getProcess, startProcess)
		.post('/app/:id/process/:pid/stop', getProcess, stopProcess)
		
		.post('/app/:id/process', saveProcess)
		.delete('/app/:id/process/:pid', getProcess, deleteProcess)
	
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
		user: req.user._id
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
	if (req.query.partial) {
		res.render('app/app')
		return;
	}
	
	res.send({
		app: res.locals.app
	})
}

function viewDashboard (req, res) {
	res.render('app/dashboard')
}

function getProcesses (req, res) {
	models.AppProcess.find({
		app: res.locals.app._id
	}, function(err, processes) {
		res.send({
			status: 200,
			processes: processes
		});
	})
}

function viewProcessModal(req, res) {
	res.render('app/processModal');
}

function getProcess (req, res, next) {
	var pid = req.params.pid;

	try {
		pid = mongoose.Types.ObjectId(pid);
	} catch (e) {
		res.send({
			status: 404,
			message: "Process Not Found"
		});

		return;
	}

	models.AppProcess.findOne({
		_id: pid
	}, function(err, process) {
		if (err) throw err;

		if (!process) {
			res.send({
				status: 404,
				message: "Process Not Found"
			});

			return;
		}

		res.locals.process = process;
		next();
	});
}

function viewProcess (req, res) {
	res.send({
		process: res.locals.process
	});
}

function saveProcess (req, res) {
	if (!req.body.process) {
		res.send(400, {
			status: 400,
			message: "Invalid Request"
		});

		return;
	}

	var name = req.body.process.name;
	var serverid = req.body.process.server;

	if (name && name.length == 0) {
		res.send({
			status: 400,
			message: "Invalid Process Name"
		});

		return;
	}

	try {
		serverid = mongoose.Types.ObjectId(serverid);
	} catch (e) {
		res.send({
			status: 400,
			message: "Bad Server"
		});

		return;
	}

	models.Server.findOne({
		_id: serverid
	}, function(err, server) {
		if (err) throw err;

		if (!server) {
			res.send({
				status: 400,
				message: "Invalid Server"
			});
			return;
		}

		var process = res.locals.process;
		if (!process) {
			// Creating a process
			var process = new models.AppProcess({
				app: res.locals.app._id
			});
		}
		process.server = server._id;
		process.name = name;

		process.save();

		res.send({
			status: 200
		});
	})
}

function deleteProcess (req, res) {

}

function stopProcess (req, res) {
	var process = res.locals.process;
	process.populate('server', function(err) {
		if (err) throw err;
		
		app.backend.publish('server_'+process.server.identifier, JSON.stringify({
			id: process._id,
			action: 'stop'
		}));
		
		res.send({
			status: 200
		})
	})
}

function startProcess (req, res) {
	var process = res.locals.process;
	process.populate('server', function(err) {
		if (err) throw err;

		app.backend.publish('server_'+process.server.identifier, JSON.stringify({
			id: process._id,
			action: 'start'
		}));
		
		res.send({
			status: 200
		})
	})
}

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
		getProcess(req, res, function() {
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