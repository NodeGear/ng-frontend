angular.module('nodegear', [])

.controller('SignInController', function($scope, $http, $rootScope) {
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
});