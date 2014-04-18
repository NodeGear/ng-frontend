define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('AppLogsController', function ($scope, $http, $rootScope, app, $state) {
		$scope._app = app;
		$scope.app = app.app;

		$scope.processes = [];
		$scope.process = null

		$http.get(app.appRoute+'/processes?includeDeleted=true').success(function(data, status) {
			$scope.processes = [];

			for (var i = 0; i < data.processes.length; i++) {
				var proc = data.processes[i];
				if ($scope.process == null && proc.deleted == false) {
					$scope.process = proc._id;

					$state.transitionTo('app.logs.process', {
						id: app.app.nameUrl,
						pid: proc._id
					});
				}

				proc.deletedString = proc.deleted ? 'Deleted Process' : '';

				$scope.processes.push(proc);
			}

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		});
	});

	app.controller('AppLogProcessController', function($scope, $http, $rootScope, app, $state, process) {
		$scope._app = app;
		$scope.app = app.app;

		// The parent scope here is AppLogsController
		$scope.process = process;
		$scope.$parent.process = process;
		$scope.logs = [];
		$scope.log = 'Latest'

		// Get logs for the process
		$http.get(app.appRoute+'/logs/'+process).success(function(data, status) {
			$scope.logs = data.logs;
			$scope.logs.splice(0, 0, 'Latest')

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		});

		$scope.$watch('process', function(newProcess, oldProcess) {
			if (!newProcess) {
				return;
			}

			$state.transitionTo('app.logs.process', {
				id: app.app.nameUrl,
				pid: $scope.process
			});
		})

		$scope.$watch('log', function(newLog) {
			if (!newLog) {
				$state.transitionTo('app.logs.process', {
					id: app.app.nameUrl,
					pid: $scope.process
				});
				return;
			}

			$state.transitionTo('app.logs.process.log', {
				id: app.app.nameUrl,
				pid: $scope.process,
				lid: $scope.log
			});
		})
	})

	app.controller('AppLogController', function($scope, $http, $rootScope, app, $state, log) {
		$scope._app = app;
		$scope.app = app.app;

		$scope.$parent.log = log;

		$scope.$on('$destroy', function() {
			$scope.watchLog(false);
		});

		$scope.processLog = function(data) {
			if (data.pid != $scope.$parent.process) {
				return;
			}

			$scope.entries.splice(0, 0, data.log);

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		}

		$scope.watchLog = function(watch) {
			if (!watch) {
				socket.removeListener('process_log', $scope.processLog);
				socket.emit('unsubscribe_log', {
					id: app.app._id,
					pid: $scope.$parent.process
				});
			} else {
				socket.on('process_log', $scope.processLog);
				socket.emit('subscribe_log', {
					id: app.app._id,
					pid: $scope.$parent.process
				});
			}
		}

		if (log == 'Latest') {
			$scope.watchLog(true);
		}

		$scope.entries = [];

		$http.get(app.appRoute+'/logs/'+$scope.$parent.process+'/'+log).success(function(data) {
			$scope.entries = data.entries;

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		})
	});
});