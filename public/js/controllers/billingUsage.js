define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('CurrentUsageController', function ($scope, $http, $rootScope) {
		$scope.init = function () {
			$scope.balanceStyle = {
				color: 'green'
			};
			$scope.balance = 2.99;
			$scope.balanceStatus = "You have credit";
			
			$scope.usageStyle = {
				color: 'red'
			};
			$scope.used = 0.31;
		}
	});
});