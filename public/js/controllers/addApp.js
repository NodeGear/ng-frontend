define([
	'angular',
	'app',
	'moment',
	'../services/csrf',
	'../services/servers'
], function(angular, app, moment) {
	app.controller('AddAppController', function ($scope, $http, $rootScope, csrf, servers) {
		var socket = io.connect();

		$scope.creating = false;
		$scope.status = "";
		$scope.running = true;
		$scope.processid = "";
		$scope.logs = [];

		$scope.$on('$destroy', function() {
			socket.removeListener('process_log', $scope.processLog);
			socket.removeListener('app_running', $scope.app_running);

			socket.emit('unsubscribe_log', {
				id: $scope.app_id,
				pid: $scope.processid
			});
		})
		
		$scope.create = function () {
			$scope.status = "Creating Application...";

			$http.post('/apps/add', {
				_csrf: csrf.csrf,
				name: $scope.name,
				template: $scope.template,
				custom_location: $scope.custom_location,
				custom_branch: $scope.custom_branch
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.app_id = data.id;
					$scope.app_url = data.nameUrl;

					$scope.createDomain();

					$http.get('/apps').success(function(data, status) {
						$rootScope.apps = data.apps;
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

		$scope.createDomain = function() {
			$scope.status = "Creating Domain..";

			var data = {
				_csrf: csrf.csrf,
				domain: {
					domain: $scope.app_url,
					is_subdomain: true
				}
			};
			var url = '/app/'+$scope.app_url+'/domain';

			$http.post(url, data).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = "Domain Added";
					$scope.addProcess();
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

		$scope.addProcess = function() {
			$scope.status = "Creating Process..";

			var data = {
				_csrf: csrf.csrf,
				process: {
					name: $scope.name
				}
			};
			var url = '/app/'+$scope.app_url+'/process';

			servers.getServers(function(servers) {
				data.process.server = servers[0]._id;

				$http.post(url, data).success(function(data, status) {
					if (data.status == 200) {
						$scope.status = "Process Added";
						$scope.processid = data.process;
						$scope.startProcess(data.process);
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
			});
		}

		$scope.startProcess = function(process) {
			$scope.status = "Starting Process..";

			socket.on('process_log', $scope.processLog);
			socket.on('app_running', $scope.app_running);

			socket.emit('subscribe_log', {
				id: $scope.app_id,
				pid: process
			});

			$http.post('/app/'+$scope.app_id+'/process/'+process+'/start', {
				_csrf: csrf.csrf
			}).success(function(data) {
				if (data.status == 200) {
					$scope.status = "Process Starting..";
					$scope.creating = true;
				} else {
					$scope.status = "Process Failed to start.";
					$scope.creating = true;
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			}).error(function() {
				$scope.status = "The Request has Failed";
				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}

		$scope.processLog = function(data) {
			if (data.pid == $scope.processid) {
				$scope.logs.splice(0, 0, data.log);
			}

			if ($scope.logs.length > 100) {
				$scope.logs = $scope.logs.slice(0, 100);
			}

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		}

		$scope.app_running = function(data) {
			if (data._id != $scope.processid) {
				return;
			}

			$scope.is_running = data.running;
			if ($scope.is_running == true) {
				$scope.status = "Process Started!";
			}

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		}
	})
});