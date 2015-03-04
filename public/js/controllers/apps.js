define([
	'angular',
	'app',
	'moment',
	'socketio',
	'../services/app',
	'../directives/apps',
	'./appDashboard'
], function(angular, app, moment, io) {
	app.registerController('AppsController', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
		$scope.appsOff = 0;
		$scope.appsOn = 0;

		var socket = io('/process_stats');

		$scope.getApps = function () {
			$http.get('/apps').success(function(data, status) {
				$scope.apps = data.apps;

				for (var i = 0; i < $scope.apps.length; i++) {
					if ($scope.apps[i].stopped == 0 && $scope.apps[i].running > 0) {
						$scope.appsOn++;
					} else {
						$scope.appsOff++;
					}

					if ($scope.apps[i].running > 0) {
						$scope.apps[i].isRunning = true;
					} else {
						$scope.apps[i].isRunning = false;
					}
				}
			});
		}
		$scope.getApps();

		$scope.process_stats = function(data) {
			if (!$scope.apps) return;

			for (var i = 0; i < $scope.apps.length; i++) {
				var app = $scope.apps[i];

				if (!app.stat_processes) app.stat_processes = [];

				if (app._id != data.app) continue;

				var found = false;
				for (var x = 0; x < app.stat_processes.length; x++) {
					var stat = app.stat_processes[x];
					if (stat._id == data._id) {
						app.stat_processes[x] = data;
						found = app.stat_processes[x];
						break;
					}
				}

				if (!found) {
					app.stat_processes.push(data);
					
					found = data;
				}

				found.monitor.rssString = found.monitor.rss + ' KB';
				if (found.monitor.rss > 1024) {
					found.monitor.rssString = Math.round(found.monitor.rss / 1024) + ' MB';
				}
				if (found.monitor.rss > 1024 * 1024) {
					found.monitor.rssString = Math.round(found.monitor.rss / 1024 / 1024) + ' GB';
				}
			}

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		};

		socket.on('process_stats', $scope.process_stats);
		$scope.$on('$destroy', function() {
			socket.removeListener('process_stats', $scope.process_stats);
		});
	}]);
});
