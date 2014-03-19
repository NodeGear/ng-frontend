define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('AccountSettingsController', function ($scope, $http) {
		$scope.user = {};
		$scope.csrf = "";
		$scope.formDisabled = true;

		$scope.init = function (csrf) {
			$scope.csrf = csrf;

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
				_csrf: $scope.csrf,
				user: $scope.user
			}).success(function(data, status) {
				$scope.status = data.message;

				if (data.status == 200) {
					$scpoe.changePassword = false;
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		};
	})
});