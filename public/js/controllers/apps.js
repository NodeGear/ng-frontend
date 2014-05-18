define([
	'angular',
	'app',
	'moment',
	'../services/app',
	'../directives/apps',
	'./appDashboard'
], function(angular, app, moment) {
	app.registerController('AppsController', function ($scope, $http, $rootScope) {
		$scope.appsOff = 0;
		$scope.appsOn = 0;

		if (!$scope.apps) return;

		for (var i = 0; i < $scope.apps.length; i++) {
			if ($scope.apps[i].isRunning) {
				$scope.appsOn++;
			} else {
				$scope.appsOff++;
			}
		}
	});
});