define([
	'angular',
	'app',
	'./csrf',
	'./servers'
], function(angular, app) {
	app.service('app', function($http, csrf, servers, $rootScope) {
		var self = this;

		self.app = {};
		self.appRoute = '';

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

				cb();
			})
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