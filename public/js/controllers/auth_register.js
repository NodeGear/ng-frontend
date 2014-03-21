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
			["email", "name", "username"].forEach(function(it) {
				if (localStorage["register_"+it]) {
					$scope.user[it] = localStorage["register_"+it];
				}

				$scope.$watch('user.'+it, function(val) {
					if (typeof val !== 'undefined' && val.length > 0) {
						localStorage["register_"+it] = val;
					} else {
						localStorage["register_"+it] = "";
					}
				})
			})
		}
	});
});