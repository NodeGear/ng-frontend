define([
	'app',
	'moment',
	'services/user'
], function(app, moment) {
	app.registerController('AccountSettingsController', ['$scope', '$http', function ($scope, $http) {
		$scope.user = {};
		$scope.formDisabled = true;

		$scope.init = function () {
			$scope.reloadUser();
		}

		$scope.reloadUser = function() {
			$http.get('/profile/profile')
				.success(function(data, status) {
					$scope.formDisabled = false;
					if (data.status == 200) {
						$scope.user = data.user;
					}

					if (!$scope.$$phase) {
						$scope.$digest()
					}
			})
		}

		$scope.saveUser = function() {
			$http.put('/profile/profile', {
				user: $scope.user
			}).success(function (data, status) {
				$scope.status = "Account Updated.";
				$scope.changePassword = false;
			}).error(function (data, status) {
				$scope.status = data.message;
			})
		};

		$scope.setChangePassword = function(change) {
			$scope.changePassword = change;

			if (!change) {
				$scope.user.password = "";
				$scope.user.newPassword = "";
			}
		};
	}]);

	app.registerController('NewsletterCtrl', ['$scope', '$http', 'user', function ($scope, $http, user) {
		$scope.status = "";

		$scope.subscribe = function () {
			$http.post('/profile/newsletter')
			.success(function () {
				user.getUser(function() {
					if (!$scope.$$phase) $scope.$digest();
				});
				
				$scope.status = "Subscribed!"
			})
			.error(function () {
				$scope.status = "Subscription Request Failed!";
			})
		}

		$scope.unsubscribe = function () {
			$http.delete('/profile/newsletter')
			.success(function () {
				user.getUser(function() {
					if (!$scope.$$phase) $scope.$digest();
				});

				$scope.status = "You've been Unsubscribed"
			})
			.error(function () {
				$scope.status = "Unsubscription Failed!";
			})
		}
	}])
});