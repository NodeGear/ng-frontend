define([
	'../app'
], function(app) {
	app.registerController('PasswordResetController', ['$scope', '$http', function($scope, $http) {
		$scope.status = "";
		$scope.password = {
			fail: false,
			pwd: "",
			repeat: ""
		}

		$scope.reset = function() {
			$scope.status = "Resetting.."
			
			$http.post('/auth/passwordReset', {
				pwd: $scope.password.pwd
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = "Reset Successful"
					window.location = "/";
				} else {
					$scope.status = data.message;
				}
			});
		}

		$scope.$watch('password.pwd', function (pwd) {
			if (pwd && pwd.length > 0 && pwd != $scope.password.repeat) {
				$scope.password.fail = true;
			} else {
				$scope.password.fail = false;
			}
		});
		$scope.$watch('password.repeat', function (pwd) {
			if (pwd && pwd.length > 0 && pwd != $scope.password.pwd) {
				$scope.password.fail = true;
			} else {
				$scope.password.fail = false;
			}
		});
	}]);
});