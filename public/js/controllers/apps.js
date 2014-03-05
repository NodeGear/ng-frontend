define([
	'angular',
	'app'
], function(angular, app) {
	app.controller('AppController', function ($scope, data, $http, $rootScope) {
		var socket = io.connect();
	
		socket.on('app:logdata', function(data) {
			if (data.app != $scope.app._id) return; // not for us...
		
			// find the log
			if ($scope.log._id != data.log) return; // log not selected..
		
			$scope.log.content = data.data + $scope.log.content;
		
			if (!$scope.$$phase) {
				$scope.$digest()
			}
		})
	
		$scope.app = data.app || {}
		$rootScope.app = {
			_id: data.app._id,
			name: data.app.name
		}
	
		for (var i = 0; i < $scope.app.events.length; i++) {
			$scope.app.events[i].created = moment($scope.app.events[i].created);
		}
		// not a good solution..
		$scope.app.events.reverse();
	
		for (var i = 0; i < $scope.app.logs.length; i++) {
			$scope.app.logs[i].created = moment($scope.app.logs[i].created);
			$scope.app.logs[i].watching = false;
		}
	
		$scope.newEnv = {};
	
		$scope.log = null;
		$scope.usage = [];
	
		$scope.setCsrf = function (csrf) {
			$scope.csrf = csrf;
		}
	
		$scope.addEnv = function () {
			$scope.app.env.push({
				name: $scope.newEnv.name,
				value: $scope.newEnv.value,
				created: Date.now()
			});
			$scope.newEnv = {};
		}
	
		$scope.saveSettings = function () {
			var payload = {
				_csrf: $scope.csrf,
				name: $scope.app.name,
				env: $scope.app.env
			};
		
			$http.put("/app/"+$scope.app._id, payload).success(function(data, status) {
				console.log(data);
			})
		}
	
		$scope.selectLog = function (log) {
			$scope.log = log
		
			$http.get('/app/'+$scope.app._id+'/log/'+log._id).success(function(data, status) {
				$scope.log = data.log;
			})
		}
	
		$scope.watchLog = function (log) {
			if (typeof log.watching === 'undefined') {
				log.watching = false;
			}
			log.watching = !log.watching;
		
			socket.emit('app:watchLog', {
				app: $scope.app._id,
				log: log._id,
				watch: log.watching
			});
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
	
		$scope.startApp = function () {
			$scope.app.isRunning = true;
			$http.get('/app/'+$scope.app._id+'/start')
		}
		$scope.stopApp = function () {
			$scope.app.isRunning = false;
			$http.get('/app/'+$scope.app._id+'/stop')
		}
		$scope.restartApp = function () {
			$scope.app.isRunning = true;
			$http.get('/app/'+$scope.app._id+'/restart')
		}
		$scope.installApp = function () {
			$scope.app.isInstalled = true;
			$scope.app.installedOn = "demo";
			$http.get('/app/'+$scope.app._id+'/install')
		}
		$scope.deleteApp = function () {
			$scope.app.deleted = true;
			$http.get('/app/'+$scope.app._id+'/delete')
		}
	
		$scope.addProcess = function () {
			$http.put('/app/'+$scope.app._id+'/scale', {
				_csrf: $scope.csrf,
				processes: ++$scope.app.processes
			})
		}
		$scope.removeProcess = function () {
			$http.put('/app/'+$scope.app._id+'/scale', {
				_csrf: $scope.csrf,
				processes: --$scope.app.processes
			})
		}
	
		$scope.plotGraphs = function () {
			var mem = [], cpu = [];
		
			for (var i = 0; i < $scope.usage.length; i++) {
				var u = $scope.usage[i];
				mem.push([u.time.getTime(), u.memory])
				cpu.push([u.time.getTime(), u.cpu])
			}
		
			$('#usageGraph').highcharts({
				title: {
					text: ''
				},
				xAxis: {
					type: 'datetime'
				},
				yAxis: [{
					title: {
						text: 'CPU %'
					},
	            min: 0
				}, {
					title: {
						text: 'RAM (MB)'
					},
					min: 0,
					opposite: true,
					allowDecimals: true
				}],
		      credits: {
					enabled: false
				},
				series: [{
					name: 'CPU %',
					data: cpu,
					yAxis: 0,
					type: 'spline'
				}, {
					name: 'RAM (MB)',
					data: mem,
					yAxis: 1,
					type: 'spline'
				}]
			})
		}
	
		if ($scope.app.logs && $scope.app.logs.length > 0) {
			$scope.selectLog($scope.app.logs[0])
		}
	})

	.directive('appStart', function(){
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', scope.startApp)
			}
		}
	})
	.directive('appStop', function(){
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', scope.stopApp)
			}
		}
	})
	.directive('appRestart', function(){
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', scope.restartApp)
			}
		}
	})
	.directive('appInstall', function(){
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', scope.installApp)
			}
		}
	})
	.directive('appDelete', function(){
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', scope.deleteApp)
			}
		}
	})
});