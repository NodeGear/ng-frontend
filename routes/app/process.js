var mongoose = require('mongoose')
	, models = require('ng-models')
	, config = require('../../config')
	, util = require('../../util')
	, app = require('../../app')

exports.router = function(_app) {
	_app.get('/app/:id/processes', getProcesses)

		.all('/app/:id/process/:pid', getProcess)
		.all('/app/:id/process/:pid/*', getProcess)

		.post('/app/:id/process', saveProcess)
		.get('/app/:id/process/:pid', viewProcess)
		.put('/app/:id/process/:pid', saveProcess)
		.post('/app/:id/process/:pid/start', startProcess)
		.post('/app/:id/process/:pid/stop', stopProcess)
		.delete('/app/:id/process/:pid', deleteProcess)
}

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
	})
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

function saveProcess (req, res) {
	if (res.locals.process && res.locals.process.deleted) {
		// Process was deleted
		res.send({
			status: 400
		});
		return;
	}

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

		if (!process.running) {
			process.server = server._id;
		}
		process.name = name;

		process.save();

		res.send({
			status: 200
		});
	})
}

function deleteProcess (req, res) {
	if (res.locals.process.deleted) {
		// Process was deleted
		res.send({
			status: 400
		});
		return;
	}

	var process = res.locals.process;
	if (process.running) {
		res.send({
			status: 400,
			message: "Cannot delete a running process!"
		});
		return;
	}

	process.deleted = true;
	process.save();

	res.send({
		status: 200,
		message: ""
	});
}

function stopProcess (req, res) {
	if (res.locals.process.deleted) {
		// Process was deleted
		res.send({
			status: 400
		});
		return;
	}

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
	if (res.locals.process.deleted) {
		// Process was deleted
		res.send({
			status: 400
		});
		return;
	}

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