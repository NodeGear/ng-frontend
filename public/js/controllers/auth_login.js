define([
	'angular',
	'../app',
	'./tfa'
], function(angular, app) {
	app.controller('SignInController', function($scope, $http, $rootScope, $state) {
		$scope.status = "";
		$scope.user = {
			auth: "",
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
				auth: user.auth,
				password: pwd
			}).success(function(data, status) {
				if (data.status == 200) {
					if (data.tfa) {
						// Requires tfa..
						$state.transitionTo('tfa')
						return;
					}
					if (!data.email_verification) {
						// Requires user to verify email
						$state.transitionTo('verifyEmail');
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

		if (isLocalStorageCapable && localStorage["login_auth"]) {
			$scope.status = "Welcome Back!";
			$scope.user.auth = localStorage["login_auth"];
			$('form[name=login] input[type=password]').trigger('focus');
		} else {
			$('form[name=login] input[type=text]').trigger('focus');
		}

		$scope.$watch('user.auth', function(auth) {
			if (isLocalStorageCapable) {
				if (typeof auth !== 'undefined' && auth.length > 0) {
					localStorage["login_auth"] = auth;
				} else {
					localStorage["login_auth"] = "";
				}
			}
		})
	});
});