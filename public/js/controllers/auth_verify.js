define([
	'angular',
	'../app',
	'./tfa'
], function(angular, app) {
	app.controller('VerifyEmailController', function($scope, $http) {
		$scope.status = "";
		$scope.csrf = "";
		$scope.code = "";
		
		$scope.init = function (csrf) {
			$scope.csrf = csrf;
		}
	
		$scope.verify = function() {
			$scope.status = "Registering.."
			
			$http.post('/auth/password', {
				_csrf: $scope.csrf,
				user: $scope.user
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = "Registration Successful"
					$state.transitionTo('emailVerification')
				} else {
					if (data.taken) {
						$scope.help_text = {};
						if (data.taken.username) {
							$scope.help_text.username = "Username is taken";
						}
						if (data.taken.email) {
							$scope.help_text.email = "Email is already in use";
						}
					}

					$scope.status = data.message;
				}
			});
		}
	});
});