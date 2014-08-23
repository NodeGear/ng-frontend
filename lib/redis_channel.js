var app = require('./app')
	, redis = require('redis')
	, config = require('./config')
	, mongoose = require('mongoose')
	, models = require('ng-models')
	, bugsnag = require('bugsnag');

var client = redis.createClient(config.credentials.redis_port, config.credentials.redis_host);
var dog = redis.createClient(config.credentials.redis_port, config.credentials.redis_host); // Dogs fetch and retrieve messages

if (config.production) {
	client.auth(config.credentials.redis_key)
	dog.auth(config.credentials.redis_key)
}

dog.subscribe("pm:app_log_entry");
dog.subscribe("pm:app_event");
dog.subscribe("pm:app_running");

dog.subscribe("git:install");
dog.subscribe('server_stats');
dog.subscribe('process_stats');

dog.on("message", function(channel, message) {
	//console.log(channel)
	switch(channel) {
		case 'pm:app_event':
			new_event(message);
			break;
		case 'pm:app_log_entry':
			new_log(message);
			break;
		case 'pm:app_running':
			app_running(message);
			break;
		case 'git:install':
			git_verification(message);
			break;
		case 'server_stats':
			process_server_stats(message);
			break;
		case 'process_stats':
			process_stats(message);
	}
});

function git_verification (message) {
	var split = message.split('|', 1);

	var key_id = split[0];
	var msg = message.substr(key_id.length+1);

	models.RSAKey.findOne({
		_id: key_id
	}).lean().exec(function(err, key) {
		if (err) throw err;

		var socks = app.io.of('/git_install').connected;
		for (var sock in socks) {
			if (!socks.hasOwnProperty(sock)) continue;
			var socket = socks[sock];

			if (socket.request.user && socket.request.user._id.equals(key.user)) {
				socket.emit('git:install', {
					_id: key_id,
					message: msg,
					system_key: key.system_key
				});
			}
		};
	});
}

function new_log (message) {
	var split = message.split('|', 1);

	var pid = split[0];
	var msg = message.substr(pid.length+1);

	try {
		pid = mongoose.Types.ObjectId(pid);
	} catch (e) {
		console.log("Invalid LOG App PID", pid);

		return;
	}

	models.AppProcess.findOne({
		_id: pid
	})
	.populate({
		path: 'app',
		select: 'user',
		options: {
			lean: true
		}
	})
	.lean()
	.exec(function(err, app_process) {
		if (err) throw err;

		if (!(app_process && app_process.app && app_process.app.user)) {
			console.log("Log process doesn't exist/have an owner.")
			console.log(app_process);
			return;
		}

		var socks = app.io.of('/process_log').connected;
		for (var sock in socks) {
			if (!socks.hasOwnProperty(sock)) continue;
			var socket = socks[sock];

			socket.rooms.forEach(function (room) {
				if (room == app_process._id && socket.request.user._id.equals(app_process.app.user)) {
					socket.emit('process_log', {
						pid: pid,
						log: msg
					});
				}
			})
		}

	})
}

function new_event (message) {
	try {
		var _id = mongoose.Types.ObjectId(message);
	} catch (e) {
		console.log("Invalid new_event EID", message);

		return;
	}

	models.AppEvent.findOne({
		_id: _id
	})
	.populate({
		path: 'app',
		select: 'user',
		options: {
			lean: true
		}
	})
	.lean()
	.exec(function(err, ev) {
		if (err) throw err;

		if (!(ev && ev.app && ev.app.user)) {
			console.log("App Process produced an event, but doesn't exist/have an owner.")
			console.log(ev);
			return;
		}

		var socks = app.io.of('/app_event').connected;
		for (var sock in socks) {
			if (!socks.hasOwnProperty(sock)) continue;
			var socket = socks[sock];
			var u = socket.request.user;

			if (u._id.equals(ev.app.user)) {
				socket.emit('app_event', {
					_id: ev._id,
					created: ev.created,
					app: ev.app._id,
					process: ev.process,
					name: ev.name,
					message: ev.message
				});
			}
		}
	})
}

function app_running (message) {
	var split = message.split('|', 1);

	var pid = split[0];
	var running = message.substr(pid.length+1) == 'true' ? true : false;

	try {
		pid = mongoose.Types.ObjectId(pid);
	} catch (e) {
		console.log("Invalid App_Running PID", pid);

		return;
	}

	models.AppProcess.findOne({
		_id: pid
	})
	.populate({
		path: 'app',
		select: 'user',
		options: {
			lean: true
		}
	})
	.lean()
	.exec(function(err, app_process) {
		if (err) throw err;

		if (!(app_process && app_process.app && app_process.app.user)) {
			console.log("App Process changed state, but doesn't exist/have an owner.")
			console.log(app_process);
			return;
		}

		var socks = app.io.of('/app_running').connected;
		for (var sock in socks) {
			if (!socks.hasOwnProperty(sock)) continue;
			var socket = socks[sock];
			var u = socket.request.user;

			if (u._id.equals(app_process.app.user)) {
				socket.emit('app_running', {
					_id: app_process._id,
					running: running
				});
			}
		}
	})
}

function process_server_stats (message) {
	try {
		var socks = app.io.of('/server_stats');
	} catch (e) {
		// not ready
		return;
	}

	for (var sock in socks.connected) {
		if (!socks.connected.hasOwnProperty(sock)) {
			continue;
		}

		var socket = socks.connected[sock];
		if (socket.request.user && socket.request.user.admin) {
			try {
				var msg = JSON.parse(message);
				socket.emit('server_stats', msg);
			} catch (e) {}
		}
	}
}

function process_stats (message) {
	var msg;
	try {
		msg = JSON.parse(message);
		var ns = app.io.of('/process_stats');
	} catch (e) {
		return;
	}

	// Lookup user
	models.App.findOne({
		_id: msg.app
	})
	.select('user')
	.lean()
	.exec(function(err, app) {
		if (err) throw err;

		if (!app) return;

		for (var id in ns.connected) {
			if (!ns.connected.hasOwnProperty(id)) {
				continue;
			}

			var sock = ns.connected[id];

			if (sock.request.user && sock.request.user._id.equals(app.user)) {
				sock.emit('process_stats', msg);
			}
		}
	})
}