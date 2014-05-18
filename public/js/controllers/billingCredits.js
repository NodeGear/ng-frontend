define([
	'angular',
	'app',
	'moment',
	'../services/csrf'
], function(angular, app, moment) {
	app.registerController('BillingCreditsController', function ($scope, $http, $rootScope, csrf) {
		$scope.cards = [];
		$scope.paymentOptions = [{
			name: "Pay £5 GBP",
			value: 5
		}, {
			name: "Pay £10 GBP",
			value: 10
		}, {
			name: "Pay £25 GBP",
			value: 25
		}, {
			name: "Pay £50 GBP",
			value: 50
		}, {
			name: "Pay £100 GBP",
			value: 100
		}];
		$scope.selectedOption = $scope.paymentOptions[0].value;
		$scope.card = "";

		$scope.status = "";
		$scope.payEnabled = true;

		$scope.pay = function() {
			$scope.payEnabled = false;
			$scope.status = "Processing...";

			$http.post('/profile/billing/addCredits', {
				_csrf: csrf.csrf,
				card: $scope.card,
				value: $scope.selectedOption
			}).success(function(data, status) {
				$scope.payEnabled = true;

				$scope.status = data.message;

				if (typeof $rootScope.reloadBalance === 'function') {
					$rootScope.reloadBalance();
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			}).error(function(data) {
				$scope.status = "Server Error. Please try again later."
				$scope.payEnabled = true;

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}

		$scope.reload = function () {
			$http.get('/profile/cards').success(function(data, status) {
				var cards = [];
				for (var i = 0; i < data.cards.length; i++) {
					var c = data.cards[i];

					c.nameFormatted = c.name + " XXXX" + c.last4;
					if (c.default) {
						c.nameFormatted = "(Default) " + c.nameFormatted;
						$scope.card = c._id;
					}

					cards.push(c);
				}
				$scope.cards = cards;

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}

		$scope.init = function () {
			$scope.reload()

			$scope.selectedOption = $scope.paymentOptions[0].value;
			$scope.card = "";
		}
	});
});