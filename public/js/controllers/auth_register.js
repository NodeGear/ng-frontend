define([
	'angular',
	'../app',
	'./tfa'
], function(angular, app) {
	app.controller('SignUpController', function($scope, $http, $rootScope) {
		$scope.status = "";
		$scope.user = {};
		$scope.csrf = "";
		
		$scope.resetUser = function() {
			$scope.user = {
				name: "",
				username: "",
				email: "",
				password: ""
			};
		};

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
						$rootScope.showTFA = data.tfa;
						return;
					}
				
					$scope.status = "Login Successful"
					window.location = "/";
				} else {
					$scope.status = data.message;
				}
			});
		}

		$scope.resetUser();

		var isLocalStorageCapable = false;
		try {
			isLocalStorageCapable = 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			isLocalStorageCapable = false;
		}

		if (isLocalStorageCapable) {
			["register_email", "register_name", "register_username"].each(function() {
				
			})
			if (localStorage["register_email"]) {
				$scope.user.email = localStorage["login_email"];
			}
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