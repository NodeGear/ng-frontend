var mongoose = require('mongoose'),
	models = require('ng-models'),
	config = require('../../config'),
	util = require('../../util'),
	app = require('../../app');

exports.router = function(_app) {
	_app.get('/app/:id/processes', getProcesses)

		.all('/app/:id/process/:pid', getProcess)
		.all('/app/:id/process/:pid/*', getProcess)

		.post('/app/:id/process', checkAppLimit, saveProcess)
		.get('/app/:id/process/:pid', viewProcess)
		.put('/app/:id/process/:pid', saveProcess)
		.post('/app/:id/process/:pid/start', startProcess)
		.post('/app/:id/process/:pid/stop', stopProcess)
		.delete('/app/:id/process/:pid', deleteProcess);
};

exports.getProcess = getProcess;

function getProcesses (req, res) {
	var query = {
		app: res.locals.app._id
	};

	if (req.query.includeDeleted != 'true') {
		query.deleted = false;
	}

	models.AppProcess.find(query).sort('name').exec(function(err, processes) {
		res.send({
			status: 200,
			processes: processes
		});
	});
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
		_id: pid,
		deleted: false
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

function checkAppLimit (req, res, next) {
	// Not interested in existing processes
	if (res.locals.process) return next();

	models.App.find({
		user: req.user._id,
		deleted: false
	})
	.select('_id')
	.exec(function (err, apps) {
		var appids = [];
		for (var i = 0; i < apps.length; i++) {
			appids.push(apps[i]._id);
		}

		models.AppProcess.count({
			deleted: false,
			app: {
				$in: appids
			}
		}, function (err, processCount) {
			if (processCount >= req.user.appLimit) {
				req.userOverAppLimit = true;
			} else {
				req.userOverAppLimit = false;
			}

			next();
		});
	});
}

function saveProcess (req, res) {
	if (!req.body.process) {
		res.status(400).send({
			status: 400,
			message: "Invalid Request"
		});

		return;
	}

	var name = req.body.process.name;
	var serverid = req.body.process.server;
	
	if (!name || name.length === 0) {
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
	}, function (err, server) {
		if (err) throw err;

		if (!server) {
			res.send({
				status: 400,
				message: "Invalid Server"
			});

			config.metrics.decrement('frontend.app.processes.created');
			
			return;
		}

		var process = res.locals.process;
		if (!process) {
			// Creating a process
			if (req.userOverAppLimit) {
				return res.send({
					status: 400,
					message: "Application Limit Exceeded"
				});
			}

			process = new models.AppProcess({
				app: res.locals.app._id
			});
		}

		if (!process.running) {
			process.server = server._id;
		}
		process.name = name;

		process.save();

		config.metrics.increment('frontend.app.processes');

		res.send({
			status: 200,
			process: process._id
		});
	});
}

function deleteProcess (req, res) {
	var process = res.locals.process;
	if (process.running) {
		res.send({
			status: 400,
			message: "Cannot delete a running process!"
		});
		return;
	}

	config.metrics.decrement('frontend.app.processes');

	process.deleted = true;
	process.save();

	res.send({
		status: 200,
		message: ""
	});
}

function stopProcess (req, res) {
	var process = res.locals.process;
	process.populate('server', function(err) {
		if (err) throw err;
		
		if (!process.server) {
			res.send({
				status: 400,
				message: "Invalid Server"
			});

			return;
		}

		config.metrics.decrement('frontend.app.processes.stopped');

		app.backend.publish('server_'+process.server.identifier, JSON.stringify({
			id: process._id,
			action: 'stop'
		}));
		
		res.send({
			status: 200
		});
	});
}

function startProcess (req, res) {
	var process = res.locals.process;
	process.populate('server', function(err) {
		if (err) throw err;

		if (process.server.appsRunning > process.server.appLimit) {
			return res.send({
				status: 400,
				message: 'Server Over Capacity'
			});
		}
		
		config.metrics.increment('frontend.app.processes.started');

		app.backend.publish('server_'+process.server.identifier, JSON.stringify({
			id: process._id,
			action: 'start'
		}));
		
		res.send({
			status: 200
		});
	});
}