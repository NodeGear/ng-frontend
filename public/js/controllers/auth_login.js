define([
	'angular',
	'../app',
	'./tfa'
], function(angular, app) {
	app.controller('SignInController', function($scope, $http, $rootScope, $state) {
		$scope.status = "";
		$scope.user = {
			email: "",
			password: ""
		};
		$scope.csrf = "";
	
		$scope.setCsrf = function (csrf) {
			$scope.csrf = csrf;
		}
	
		$scope.authenticate = function(user) {
			$scope.status = "Authenticating.."
		
			var pwd = user.password;
			user.password = "";
		
			$http.post('/auth/password', {
				_csrf: $scope.csrf,
				email: user.email,
				password: pwd
			}).success(function(data, status) {
				if (data.status == 200) {
					if (data.tfa) {
						// Requires tfa..
						$state.transitionTo('tfa')
						return;
					}
				
					$scope.status = "Login Successful"
					window.location = "/";
				} else {
					$scope.status = data.message;
				}
			});
		}
		
		var isLocalStorageCapable = false;
		try {
			isLocalStorageCapable = 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			isLocalStorageCapable = false;
		}

		if (isLocalStorageCapable && localStorage["login_email"]) {
			$scope.status = "Welcome Back!";
			$scope.user.email = localStorage["login_email"];
			$('form[name=login] input[type=password]').trigger('focus');
		}

		$scope.$watch('user.email', function(email) {
			if (isLocalStorageCapable) {
				if (typeof email !== 'undefined' && email.length > 0) {
					localStorage["login_email"] = email;
				} else {
					localStorage["login_email"] = "";
				}
			}
		})
	});
});