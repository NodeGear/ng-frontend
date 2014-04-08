define([
	'angular',
	'../app',
	'./tfa'
], function(angular, app) {
	app.controller('VerifyEmailController', function($scope, $http) {
		$scope.status = "";
		$scope.csrf = "";
		$scope.codeTextTransform = "none";
		$scope.code = "";

		$scope.init = function (csrf) {
			$scope.csrf = csrf;
		}

		$scope.$watch('code', function() {
			if (typeof $scope.code != 'undefined' && $scope.code.length > 0) {
				$scope.codeTextTransform = 'uppercase';
			} else {
				$scope.codeTextTransform = 'none';
			}
		})
	
		$scope.verify = function() {
			$scope.status = "Verifying.."
			
			$http.post('/auth/verifyEmail', {
				_csrf: $scope.csrf,
				code: $scope.code
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