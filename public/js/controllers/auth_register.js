define([
	'angular',
	'../app',
	'./tfa'
], function(angular, app) {
	app.registerController('SignUpController', function($scope, $http, $state) {
		$scope.status = "";
		$scope.user = {};
		$scope.help_text = {};
		$scope.csrf = "";
		
		$scope.resetUser = function() {
			$scope.user = {
				name: "",
				username: "",
				email: "",
				password: ""
			};
			$scope.help_text = {};
		};

		$scope.init = function (csrf) {
			$scope.csrf = csrf;

			$('form[name=register] input[name=full_name]').trigger('focus');
		}

		$scope.registerUser = function () {
			$scope.status = "Registering.."
			
			$scope.help_text = {};
			
			$http.post('/auth/register', {
				_csrf: $scope.csrf,
				user: $scope.user
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = "Registration Successful"
					$state.transitionTo('verifyEmail')
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

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			});
		}

		$scope.resetUser();
	});
});