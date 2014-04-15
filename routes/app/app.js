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

exports.unauthorized = function (template) {
	template([
		['app', 'app/app'],
		'app/dashboard',
		['app/process', 'app/processModal'],
		'app/logs',
		'app/traffic',
		'app/usage',
		'app/settings',
		'app/domains',
		'app/domain'
	])
}

exports.router = function (app) {
	app.all('/app/:id', getApp)
		.all('/app/:id/*', getApp)
	
		.get('/app/:id', viewApp)

		.get('/app/:id/events', getEvents)
		.get('/app/:id/processes', getProcesses)

		.all('/app/:id/domain/:did', getDomain)
		.all('/app/:id/domain/:did/*', getDomain)
		.all('/app/:id/process/:pid', getProcess)
		.all('/app/:id/process/:pid/*', getProcess)

		.get('/app/:id/domains', getDomains)
		.post('/app/:id/domain', saveDomain)
		.get('/app/:id/domain/:did', viewDomain)
		.put('/app/:id/domain/:did', saveDomain)
		.delete('/app/:id/domain/:did', deleteDomain)

		.post('/app/:id/process', saveProcess)
		.get('/app/:id/process/:pid', viewProcess)
		.put('/app/:id/process/:pid', saveProcess)
		.post('/app/:id/process/:pid/start', startProcess)
		.post('/app/:id/process/:pid/stop', stopProcess)
		.delete('/app/:id/process/:pid', deleteProcess)
	
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
	res.send({
		status: 200,
		app: res.locals.app
	})
}

function getProcesses (req, res) {
	var query = {
		app: res.locals.app._id
	};

	if (req.query.includeDeleted != true) {
		query.deleted = false;
	}

	models.AppProcess.find(query).sort('name').exec(function(err, processes) {
		res.send({
			status: 200,
			processes: processes
		});
	})
}

function getDomains (req, res) {
	models.AppDomain.find({
		app: res.locals.app._id
	}, function(err, domains) {
		if (err) throw err;

		res.send({
			status: 200,
			domains: domains
		})
	})
}

function getDomain (req, res, next) {
	var did = req.params.did;

	try {
		did = mongoose.Types.ObjectId(did);
	} catch (e) {
		res.send({
			status: 400,
			message: "Invalid ID"
		});
		return;
	}

	models.AppDomain.findOne({
		_id: did
	}, function(err, domain) {
		if (err) throw err;

		if (!domain) {
			res.send({
				status: 404,
				message: "Not found"
			});
			return;
		}

		res.locals.domain = domain;
		next();
	})
}

function saveDomain (req, res) {
	if (!req.body.domain) {
		res.send(400, {
			status: 400,
			message: "Invalid Request"
		});

		return;
	}

	var domain = req.body.domain.domain;
	var is_subdomain = req.body.domain.is_subdomain;

	if (domain && (domain.length == 0 || domain.length >= 253)) {
		res.send({
			status: 400,
			message: "Invalid Domain Name"
		});

		return;
	}

	var query = {
		domain: domain,
		is_subdomain: is_subdomain
	};
	// Subdomains are individual
	if (is_subdomain) {
		query.user = req.user._id
	}

	models.AppDomain.findOne(query, function(err, aDomain) {
		if (err) throw err;

		if (aDomain) {
			res.send({
				status: 400,
				message: "Domain Name Taken"
			});
			return;
		}

		var d = res.locals.domain;
		if (!d) {
			// Creating a process
			d = new models.AppDomain({
				app: res.locals.app._id,
				user: req.user._id
			});
		}

		d.domain = domain;
		d.is_subdomain = is_subdomain;

		d.save();

		res.send({
			status: 200
		});
	})
}
function viewDomain (req, res) {
	res.send({
		status: 200,
		domain: res.locals.domain
	})
}
function deleteDomain (req, res) {
	var domain = res.locals.domain;
	
	models.AppDomain.remove({
		_id: domain._id
	}, function(err) {
		if (err) throw err;

		res.send({
			status: 200,
			message: ""
		});
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