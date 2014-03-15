define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('BillingHistoryController', function ($scope, $http, $rootScope) {
		$scope.init = function () {
			$scope.history = []
			$scope.reload();
		}

		$scope.reload = function() {
			$http.get('/profile/billing/history').success(function(data, status) {
				if (data.status == 200) {
					$scope.history = data.transactions;
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}
	});
});