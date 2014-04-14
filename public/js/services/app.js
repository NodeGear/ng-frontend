define([
	'angular',
	'app',
	'moment',
	'./csrf',
	'./servers'
], function(angular, app, moment) {
	app.service('app', function($http, csrf, servers, $rootScope) {
		var self = this;

		var event_format = 'h:mm:ss a Do MMM';

		self.app = {};
		self.appRoute = '';
		self.events = [];

		servers.getServers(function(servers) {
		});

		self.getApp = function (id, cb) {
			self.appRoute = '/app/'+id;
			$http.get(self.appRoute).success(function(data, status) {
				self.app = data.app;
				$rootScope.app = self.app

				cb();
			});
		}

		self.getProcesses = function (cb) {
			$http.get(self.appRoute+'/processes').success(function (data) {
				self.processes = [];

				for (var i = 0; i < data.processes.length; i++) {
					var proc = data.processes[i];

					for (var x = 0; x < servers.servers.length; x++) {
						if (proc.server == servers.servers[x]._id) {
							proc.server = servers.servers[x];
							break;
						}
					}

					self.processes.push(proc)
				}

				self.formatEvents();

				cb();
			})
		}

		self.getEvents = function(cb) {
			$http.get(self.appRoute+'/events').success(function (data) {
				self.events = [];
				for (var i = 0; i < data.events.length; i++) {
					var e = data.events[i];
					e.timeFormatted = moment(e.created).format(event_format);
					
					for (var x = 0; x < self.processes.length; x++) {
						if (e.process == self.processes[x]._id) {
							e.processObject = self.processes[x];
							break;
						}
					}

					self.events.push(e);
				}

				cb();
			})
		}
		self.addEvent = function(data) {
			self.events.splice(0, 0, data);

			self.formatEvents();

			if (self.events.length > 10) {
				self.events = self.events.slice(0, 9);
			}
		}

		self.formatEvents = function() {
			for (var i = 0; i < self.events.length; i++) {
				var ev = self.events[i];

				ev.timeFormatted = moment(ev.created).format(event_format);
				ev.processObject = null;
				for (var x = 0; x < self.processes.length; x++) {
					if (ev.process == self.processes[x]._id) {
						ev.processObject = self.processes[x];
						break;
					}
				}
			}
		}

		self.startProcess = function (process, cb) {
			$http.post(self.appRoute+'/process/'+process._id+'/start', {
				_csrf: csrf.csrf
			}).success(function(data) {
				if (data.status == 200) {
					cb(true);
				} else {
					cb(false, data.message);
				}
			}).error(function() {
				cb(false, "Request Failed");
			})
		}

		self.stopProcess = function (process, cb) {
			$http.post(self.appRoute+'/process/'+process._id+'/stop', {
				_csrf: csrf.csrf
			}).success(function(data) {
				if (data.status == 200) {
					cb(true);
				} else {
					cb(false, data.message);
				}
			}).error(function() {
				cb(false, "Request Failed");
			})
		}
	});
});