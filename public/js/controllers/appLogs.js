define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('AppLogsController', function ($scope, $http, $rootScope, app) {
		$scope._app = app;
		$scope.app = app.app;
	});
});