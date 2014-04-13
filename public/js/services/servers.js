define([
	'angular',
	'app'
], function(angular, app) {
	app.service('servers', function($http) {
		var self = this;

		self.servers = [];

		self.getServers = function(cb) {
			if (self.servers.length) return cb(self.servers);

			$http.get('/servers').success(function(data) {
				self.servers = data.servers;
				cb(data.servers);
			})
		}

		return self;
	});
});