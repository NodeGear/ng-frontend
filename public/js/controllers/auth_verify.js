define([
	'angular',
	'../app'
], function(angular, app) {
	app.registerController('VerifyEmailController', function($scope, $http) {
		$scope.status = "";
		$scope.csrf = "";
		$scope.codeTextTransform = "none";
		$scope.code = "";

		$scope.init = function (csrf) {
			$scope.csrf = csrf;

			$scope.status = "Loading...";
			$http.get('/profile/profile').success(function(data, status) {
				$scope.status = "We sent a token to "+data.user.email+".";
			}).error(function(data) {

			})
		}

		$scope.$watch('code', function() {
			if (typeof $scope.code != 'undefined' && $scope.code.length > 0) {
				$scope.codeTextTransform = 'uppercase';
			} else {
				$scope.codeTextTransform = 'none';
			}
		})
	
		$scope.verify = function() {
			$scope.status = "Authenticating TFA.."
			
			$http.post('/auth/verifyEmail', {
				_csrf: $scope.csrf,
				code: $scope.code.toUpperCase()
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = "Verification Successful"
					window.location = "/&no_router";
				} else {
					$scope.status = data.message;
				}
			});
		}
	});
});