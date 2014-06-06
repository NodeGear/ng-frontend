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

.controller('ServerController', function ($scope, $http) {
	var socket = io.connect();

	$scope.servers = [];

	$http.get('/admin/servers').success(function(data) {
		$scope.servers = data.servers;
	})

	socket.emit('watch_servers', {
		watch: true
	});

	socket.on('server_stats', function(data) {
		for (var i = 0; i < $scope.servers.length; i++) {
			if ($scope.servers[i].identifier == data.identifier) {
				$scope.servers[i].stats = data;

				$scope.servers[i].stats._mem = Math.round($scope.servers[i].stats.mem * 100)
				$scope.servers[i].stats._free = Math.round((1 - $scope.servers[i].stats.free) * 100)
				$scope.servers[i].stats._user = Math.round(100 * ($scope.servers[i].stats.user / $scope.servers[i].stats.total))
				$scope.servers[i].stats._sys = Math.round(100 * ($scope.servers[i].stats.sys / $scope.servers[i].stats.total))
				$scope.servers[i].stats._ram = Math.round($scope.servers[i].stats.memTotal / 1024 / 1024 / 1024);
			}
		}

		if (!$scope.$$phase) {
			$scope.$digest();
		}
	});
})