angular.module('nodegear', [])

.controller('PerformanceController', function ($scope) {
	var socket = io.connect();

	$scope.perfs = [];

	socket.on('performance', function(data) {
		var perf = data.perfs[0];

		perf.averageResponse = perf.averageResponse.toFixed(2);
		perf.lagAverage = perf.lagAverage.toFixed(2);
		
		$scope.perfs.splice(0, 0, perf);

		if ($scope.perfs.length > 20) {
			$scope.perfs = $scope.perfs.slice(0, 20);
		}

		if (!$scope.$$phase) {
			$scope.$digest();
		}
	})
})