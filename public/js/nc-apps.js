angular.module('nodecloud')

.controller('AppsController', function ($scope, data) {
	$scope.apps = data.apps;
	$scope.app = null;
})
.controller('AppController', function ($scope, data, $http) {
	$scope.app = data.app || {}
	
	$scope.log = null
	$scope.usage = [];
	
	$scope.selectLog = function (log) {
		$scope.log = log
		
		$http.get('/app/'+$scope.app._id+'/log/'+log._id).success(function(data, status) {
			$scope.log = data.log;
		})
	}
	
	$scope.getUsage = function () {
		$http.get('/app/'+$scope.app._id+'/usage').success(function(data, status) {
			for (var i = 0; i < data.usage.length; i++) {
				data.usage[i].time = new Date(data.usage[i].time)
				data.usage[i].memory = data.usage[i].memory / 1024 / 1024;
			}
			
			$scope.usage = data.usage;
			
			$scope.plotGraphs()
		})
	}
	
	$scope.plotGraphs = function () {
		var mem = [], cpu = [];
		
		for (var i = 0; i < $scope.usage.length; i++) {
			var u = $scope.usage[i];
			mem.push([u.time.getHours()+""+u.time.getMinutes(), u.memory])
			cpu.push([u.time.getHours()+""+u.time.getMinutes(), u.cpu])
		}
		
		$.plot("#usageGraph", [{
			data: cpu,
			lines: { show: true }
		}, {
			data: mem,
			lines: { show: true, fill: true }
		}])
	}
	
	if ($scope.app.logs && $scope.app.logs.length > 0) {
		$scope.selectLog($scope.app.logs[0])
	}
})