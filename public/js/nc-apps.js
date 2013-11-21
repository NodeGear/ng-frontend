angular.module('nodecloud')

.controller('AppsController', function ($scope, data) {
	$scope.apps = data.apps;
	$scope.app = null;
})
.controller('AppController', function ($scope, data, $http) {
	$scope.app = data.app || {}
	
	$scope.log = null
	
	$scope.selectLog = function (log) {
		$scope.log = log
		
		$http.get('/app/'+$scope.app._id+'/log/'+log._id).success(function(data, status) {
			$scope.log = data.log;
		})
	}
	
	if ($scope.app.logs && $scope.app.logs.length > 0) {
		$scope.selectLog($scope.app.logs[0])
	}
})