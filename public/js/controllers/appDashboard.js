define([
	'angular',
	'app',
	'moment',
	'../services/app',
	'../services/csrf',
	'../services/servers'
], function(angular, app, moment) {
	app.registerController('AppDashboardController', function ($scope, app, csrf, $rootScope) {
		var socket = io.connect();
		
		$scope._app = app;
		$scope.app = app.app;

		socket.emit('watch_processes', {
			watch: true
		});

		app.getProcesses(function() {
			$scope.reloadScope();

			app.getEvents(function() {
				$scope.reloadScope();
			});
		});

		$scope.processLog = function(data) {
			for (var i = 0; i < $scope._app.processes.length; i++) {
				if ($scope._app.processes[i]._id == data.pid) {
					var proc = $scope._app.processes[i];

					if (proc.watch_logs) {
						if (!proc.logs) proc.logs = [];

						proc.logs.splice(0, 0, data.log);
					}

					if (proc.log_to_status) {
						// When starting, log goes to status property
						proc.status = data.log.substr(0, 40);
					}

					$scope.reloadScope();

					return;
				}
			}
		}

		$scope.app_event = function(data) {
			if (data.app != $scope.app._id) {
				// Not for my eyes..
				return;
			}

			app.addEvent(data);

			$scope.reloadScope();
		}

		$scope.app_running = function(data) {
			if (data.app != $scope.app_id) {
				// Not in this app
				return;
			}

			for (var i = 0; i < app.processes.length; i++) {
				if (app.processes[i]._id == data._id) {
					app.processes[i].startStopDisabled = false;
					app.processes[i].running = data.running;
					break;
				}
			}

			$scope.reloadScope();
		}

		$scope.process_stats = function(data) {
			if (!$scope._app.processes) return;

			for (var i = 0; i < $scope._app.processes.length; i++) {
				var process = $scope._app.processes[i];

				if (process._id != data._id) continue;

				process.stat = data;

				process.stat.monitor.rssString = process.stat.monitor.rss + ' KB';
				if (process.stat.monitor.rss > 1024) {
					process.stat.monitor.rssString = Math.round(process.stat.monitor.rss / 1024) + ' MB';
				}
				if (process.stat.monitor.rss > 1024 * 1024) {
					process.stat.monitor.rssString = Math.round(process.stat.monitor.rss / 1024 / 1024) + ' GB';
				}
			}

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		};

		socket.on('process_stats', $scope.process_stats);
		socket.on('process_log', $scope.processLog);
		socket.on('app_event', $scope.app_event);
		socket.on('app_running', $scope.app_running);

		$scope.$on('$destroy', function() {
			socket.removeListener('process_log', $scope.processLog);
			socket.removeListener('app_event', $scope.app_event);
			socket.removeListener('app_running', $scope.app_running);
			socket.removeListener('watch_processes', $scope.process_stats);

			socket.emit('watch_processes', { watch: false });
		})

		$scope.reloadScope = function() {
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		}

		$scope.startProcess = function(process) {
			process.startStopDisabled = true;
			process.log_to_status = true;

			socket.emit('subscribe_log', {
				pid: process._id,
				id: app.app._id
			});

			app.startProcess(process, function(success, message) {
				process.startStopDisabled = true;

				if (success) {
					process.status = "Process Started";
				} else {
					process.status = message;
					process.log_to_status = false;
				}

				$scope.reloadScope();
			});
		}

		$scope.stopProcess = function(process) {
			process.startStopDisabled = true;
			process.log_to_status = true;

			socket.emit('subscribe_log', {
				pid: process._id,
				id: app.app._id
			});

			app.stopProcess(process, function(success, message) {
				process.startStopDisabled = true;

				if (success) {
					process.status = "Process Stopped.";
				} else {
					process.status = message;
					process.log_to_status = false;
				}
				
				$scope.reloadScope();
			});
		}

		$scope.showLog = function(process) {
			// Show the logs here...
		}

		$scope.watchLog = function(process) {
			if (process.log_to_status) {
				process.log_to_status = false;

				socket.emit('unsubscribe_log', {
					id: app.app._id,
					pid: process._id
				});

				process.status = "";
			} else {
				process.log_to_status = true;

				socket.emit('subscribe_log', {
					id: app.app._id,
					pid: process._id
				});

				process.status = "Watching Process Log";
			}
		}
	});

	app.registerController('AppProcessController', function ($scope, process, csrf, $http, $state, app, servers) {
		$scope.process = process.process;
		$scope.addProcess = false;
		$scope.status = "";

		if (!$scope.process._id) {
			$scope.addProcess = true;
		}

		$scope.servers = [];
		servers.getServers(function(servers) {
			$scope.servers = servers;

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		})

		$("#processModal").modal('show')
		.on('hidden.bs.modal', function() {
			$state.transitionTo('app.processes', {
				id: app.app.nameUrl
			});
		});

		$scope.deleteProcess = function() {
			$scope.status = "Deleting... ";

			$http.delete(app.appRoute+'/process/'+$scope.process._id+'?_csrf='+csrf.csrf).success(function(data) {
				if (data.status == 200) {
					$scope.status = "Process Deleted.";
					
					app.getProcesses(function() {
						app.formatEvents();
						$("#processModal").modal('hide');
					})
				} else {
					$scope.status = data.message;
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			}).error(function() {
				$scope.status = "The Request has failed.";

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}

		$scope.saveProcess = function() {
			$scope.status = "Saving... "

			var data = {
				_csrf: csrf.csrf,
				process: $scope.process
			};
			var url = app.appRoute+'/process';

			var promise = null;
			if ($scope.addProcess) {
				promise = $http.post(url, data);
			} else {
				promise = $http.put(url+'/'+$scope.process._id, data);
			}

			promise.success(function(data, status) {
				if (data.status == 200) {
					if ($scope.addProcess) {
						$scope.status = "Process Added ";
					} else {
						$scope.status = "Process Saved ";
					}

					app.getProcesses(function() {
						app.formatEvents();
						$("#processModal").modal('hide');
					})
				} else {
					$scope.status = data.message;
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			}).error(function() {
				$scope.status = "The Request has failed.";

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}
	});
});