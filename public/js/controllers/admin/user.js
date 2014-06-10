angular.module('nodegear')

.controller('UserController', function ($scope, $http) {
	$scope.csrf = "";
	$scope.user_id = "";
	$scope.user = {};
	$scope.status = "";

	$scope.init = function (csrf, userid) {
		$scope.csrf = csrf;
		$scope.user_id = userid;

		$scope.getUser();
	}

	$scope.getUser = function () {
		$http.get('/admin/user/'+$scope.user_id).success(function(data) {
			$scope.user = data.user;
		})
	}

	$scope.save = function () {
		$http.put('/admin/user/'+$scope.user_id, {
			_csrf: $scope.csrf,
			user: $scope.user
		}).success(function() {
			$scope.status = "User Saved."
		})
	}
});