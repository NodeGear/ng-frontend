define([
	'angular',
	'app',
	'moment',
], function(angular, app, moment) {
	app.service('user', function($http, $rootScope) {
		var self = this;

		self.getUser = function(cb) {
			$http.get('/profile').success(function(data) {
				$rootScope.user = self.user = data.user;
				analytics.identify(data.user._id, data.user);
				
				cb();
			});
		}
	});
});