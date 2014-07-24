define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.registerController('CurrentUsageController', function ($scope, $http, $rootScope) {
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

				$scope.used = data.usage;
				$scope.usageStyle = {
					color: negative
				};

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			});
			
			$rootScope.reloadBalance = $scope.reload;
		};
	})

	.registerController('BillingUsageController', function($scope, $http, $state) {
		$scope.usages = [];

		$http.get('/profile/billing/usage').success(function(data) {
			if (data.status == 200) {
				$scope.usages = data.usages;
			}

			for (var i = 0; i < $scope.usages.length; i++) {
				var minutes = $scope.usages[i].minutes;
				var hours = $scope.usages[i].minutes / 60;

				var start = $scope.usages[i].start;
				$scope.usages[i].startFormatted = moment(start).format('DD/MM/YY hh:mm:ss');

				var end = $scope.usages[i].end;
				if (!end) {
					end = Date.now();

					$scope.usages[i].endFormatted = 'Now';
					minutes = ((new Date(end)).getTime() - (new Date(start)).getTime()) / 1000 / 60;
					hours = minutes / 60;
					$scope.usages[i].minutes = Math.round(minutes);
					$scope.usages[i].hours = Math.round(hours);
				} else {
					$scope.usages[i].endFormatted = moment(end).format('DD/MM/YY hh:mm:ss');
				}

				var total = (hours * $scope.usages[i].price_per_hour);
				$scope.usages[i].totalPrice = (Math.round(total * 100) / 100).toFixed(2);
			}

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		})
	})
});