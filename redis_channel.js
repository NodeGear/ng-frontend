var app = require('./app');
var redis = require('redis');
var config = require('./config');

var client = redis.createClient();
var dog = redis.createClient(); // Dogs fetch and retrieve messages

if (config.env == 'production') {
	client.auth(config.redis_key)
	dog.auth(config.redis_key)
}

dog.subscribe("pm:app_log_entry");

dog.on("message", function(channel, message) {
	switch(channel) {
		case 'pm:app_log_new':
			//new_log(message);
			break;
		case 'pm:app_log_entry':
			new_log(message);
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