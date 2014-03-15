define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('CurrentUsageController', function ($scope, $http, $rootScope) {
		var positive = '#5cb85c';
		var negative = '#d9534f';

		$scope.init = function () {
			$scope.balanceStyle = {
				color: positive
			};
			$scope.balance = 0.00;
			$scope.balanceStatus = "..";
			
			$scope.usageStyle = {
				color: negative
			};
			$scope.used = 0.00;

			$scope.reload()
		}

		$scope.reload = function() {
			$http.get('/profile/balance').success(function(data, status) {
				$scope.balance = data.balance;
				if ($scope.balance >= 0) {
					$scope.balanceStyle = {
						color: positive
					}
					$scope.balanceStatus = "You have credit";
				} else {
					$scope.balanceStyle = {
						color: negative
					}
					$scope.balanceStatus = "You owe";
				}

				$scope.used = 0.00;
				$scope.usageStyle = {
					color: negative
				};

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			});
		};
	});
});