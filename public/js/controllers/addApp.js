define([
	'angular',
	'app',
	'moment',
	'socketio',
	'../services/csrf',
	'../services/servers',
	'../services/user'
], function(angular, app, moment, io) {
	app.registerController('AddAppController', function ($scope, $http, $rootScope, csrf, servers, user, $sce) {
		$scope.creating = false;
		$scope.status = "";
		$scope.running = true;
		$scope.processid = "";
		$scope.logs = [];
		$scope.servers = [];

		servers.getServers(function(servers) {
			$scope.servers = servers;
			try {
				if (!$scope.server) $scope.server = $scope.servers[0]._id;
			} catch (e) {}
		});

		var process_log = io('/process_log'),
			app_running = io('/app_running');

		$scope.$on('$destroy', function() {
			process_log.removeListener('process_log', $scope.processLog);
			app_running.removeListener('app_running', $scope.app_running);

			process_log.emit('unsubscribe_log', {
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
				custom_branch: $scope.custom_branch,
				docker: $scope.docker
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

		$scope.createDatabase = function (type, cb) {
			$scope.status = "Creating Database..";

			$http.post('/database', {
				database: {
					name: $scope.app_url,
					database_type: type
				}
			})
			.success(function (data) {
				$scope.status = "Database Created..";
				$scope.database = data.database;

				var done = 0;
				var domain = $scope.app_url+'.'+user.user.username+'.ngapp.io';
				var envs = [
					['DATABASE', 'true'],
					['DATABASE_HOST', $scope.database.db_host],
					['DATABASE_USER', $scope.database.db_user],
					['DATABASE_PASSWORD', $scope.database.db_pass],
					['DATABASE_NAME', $scope.database.db_name],
					['DOMAIN', domain]
				];
				var fn = function (iter) {
					var data = {
						env: {
							name: envs[iter][0],
							value: envs[iter][1]
						}
					};
					$http.post('/app/'+$scope.app_url+'/environment', data)
					.success(function (data) {
						done++;
						if (done >= envs.length) {
							var fn = cb;

							cb = function(){};
							fn();
						}
					})
				}

				for (var i = 0; i < envs.length; i++) {
					fn(i);
				}
			})
			.error(function (data) {
				$scope.status = "Could not create database.";
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

					var domain = $scope.app_url+'.'+user.user.username+'.ngapp.io';
					$scope.app_domain = $sce.trustAsUrl('http://'+domain);
					
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
					name: $scope.name,
					server: $scope.server
				}
			};
			var url = '/app/'+$scope.app_url+'/process';

			$http.post(url, data).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = "Process Added";
					$scope.processid = data.process;

					if ($scope.template == 'ghost') {
						$scope.createDatabase('mysql', function() {
							$scope.startProcess(data.process);
						})
					} else {
						$scope.startProcess(data.process);
					}
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
			});
		}

		$scope.startProcess = function(process) {
			$scope.status = "Starting Process..";

			process_log.on('process_log', $scope.processLog);
			app_running.on('app_running', $scope.app_running);

			process_log.emit('subscribe_log', {
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