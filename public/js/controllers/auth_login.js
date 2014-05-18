define([
	'../app'
], function(app) {
	app.registerController('SignInController', function($scope, $http, $rootScope, $state) {
		$scope.status = "";
		$scope.user = {
			auth: "",
			password: ""
		};
		$scope.csrf = "";
		$scope.loginFailed = false;
		$scope.loginFailedReason = "";
	
		$scope.setCsrf = function (csrf) {
			$scope.csrf = csrf;
		}
		
		$scope.authenticate = function(user) {
			$scope.status = "Authenticating.."
		
			var pwd = user.password;
			user.password = "";
			$scope.loginFailed = false;
		
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
					$scope.status = "";
					$scope.loginFailedReason = data.message;
					$scope.loginFailed = true;
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
			$scope.user.auth = localStorage["login_auth"];
			$('form[name=login] input[type=password]').trigger('focus');
		} else {
			$('form[name=login] input[type=email]').trigger('focus');
		}

		$scope.$watch('user.auth', function(auth) {
			if (isLocalStorageCapable) {
				if (typeof auth !== 'undefined' && auth.length > 0) {
					localStorage["login_auth"] = auth;
				} else {
					localStorage["login_auth"] = "";
				}
			}
		});
		$scope.$watch('user.password', function(pwd) {
			$scope.loginFailed = false;
		})
	});
});