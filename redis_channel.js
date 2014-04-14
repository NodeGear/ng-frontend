var app = require('./app');
var redis = require('redis');
var config = require('./config');
var mongoose = require('mongoose');
var models = require('ng-models');

var client = redis.createClient();
var dog = redis.createClient(); // Dogs fetch and retrieve messages

if (config.env == 'production') {
	client.auth(config.redis_key)
	dog.auth(config.redis_key)
}

dog.subscribe("pm:app_log_entry");
dog.subscribe("pm:app_event");
dog.subscribe("pm:app_running");

dog.on("message", function(channel, message) {
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
	}
});

function new_log (message) {
	var split = message.split('|', 1);

	var pid = split[0];
	var msg = message.substr(pid.length+1);

	var socks = app.io.sockets.clients();
	socks.forEach(function(socket) {
		socket.get('subscribe_log', function(err, processes) {
			for (var p in processes) {
				if (!processes.hasOwnProperty(p)) {
					continue;
				}

				if (processes[p] == pid) {
					socket.emit('process_log', {
						pid: pid,
						log: msg
					});
					break;
				}
			}
		})
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
	}).populate('app').exec(function(err, ev) {
		if (err) throw err;

		if (!(ev && ev.app && ev.app.user)) {
			console.log("App Process produced an event, but doesn't exist/have an owner.")
			console.log(ev);
			return;
		}

		var socks = app.io.sockets.clients();
		socks.forEach(function(socket) {
			var u = socket.handshake.user;

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
		})
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
	}).populate('app').exec(function(err, app_process) {
		if (err) throw err;

		if (!(app_process && app_process.app && app_process.app.user)) {
			console.log("App Process changed state, but doesn't exist/have an owner.")
			console.log(app_process);
			return;
		}

		var socks = app.io.sockets.clients();
		socks.forEach(function(socket) {
			var u = socket.handshake.user;

			if (u._id.equals(app_process.app.user)) {
				socket.emit('app_running', {
					_id: app_process._id,
					running: running
				});
			}
		})
	})
}