define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('BillingHistoryController', function ($scope, $http, $rootScope) {
		$scope.init = function () {
			$scope.history = []
		}
	});
});