define([
	'app',
	'moment'
], function(app, moment) {
	app.registerController('ProfileSecurityCtrl', ['$scope', '$http', function($scope, $http) {
		$scope.status = "";

		$scope.getSessions = function () {
			$http.get('/profile/security')
			.success(function (data) {
				$scope.sessions = data.sessions;

				for (var i = 0; i < $scope.sessions.length; i++) {
					$scope.sessions[i].lastAccess = moment($scope.sessions[i].lastAccess);
					$scope.sessions[i].expiry = moment($scope.sessions[i].expiry);
				}
			})
			.error(function () {
				$scope.status = "Request Failed!";
			})
		}
		$scope.getSessions();

		$scope.destroySession = function (session) {
			$http.delete('/profile/security/'+session._id)
			.success(function (data) {
				$scope.status = data.message;
			})
			.error(function (data) {
				$scope.status = "Request Failed!";
			})
		}
	}])
});