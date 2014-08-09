define([
	'angular',
	'app',
	'moment',
	'socketio',
	'async',
	'../services/servers',
	'../services/user'
], function(angular, app, moment, io, async) {
	app.registerController('CreateAppStepCtrl', function ($scope, servers) {
		$scope.step = 0;

		$scope.app = {};
		$scope.servers = [];
		
		servers.getServers(function(servers) {
			$scope.servers = servers;
			try {
				if (!$scope.app.server) $scope.app.server = $scope.servers[0]._id;
			} catch (e) {}
		});

		$scope.getServer = function (id) {
			for (var i = 0; i < $scope.servers.length; i++) {
				if ($scope.servers[i]._id == id) {
					return $scope.servers[i];
				}
			}
		}
	});

	app.registerController('CreateAppStep1Ctrl', function ($scope) {
		$scope.create = function () {
			$scope.$parent.$parent.step = 1;
		}
	});

	app.registerController('CreateAppStep2Ctrl', function ($scope, $http, $rootScope, user) {
		$scope.properties = [];

		$scope.setProperty = function (id, property) {
			var found = -1;

			for (var i = 0; i < $scope.properties.length; i++) {
				if ($scope.properties[i].id == id) {
					found = i;
				}
			}

			property.id = id;
			if (found >= 0) {
				$scope.properties[found] = property;
			} else {
				$scope.properties.push(property);
			}
		}

		$scope.createApplicationStep = function (callback) {
			$scope.status = "Creating Application..";
			$scope.setProperty('application-created', {
				name: $scope.status,
				class: "fa-circle-o-notch fa-spin"
			});

			$http.post('/apps/add', $scope.app)
			.success(function(data, status) {
				callback(null, data);

				$http.get('/apps').success(function(data, status) {
					$rootScope.apps = data.apps;
				});
			}).error(function(data, status) {
				if (status == 400) {
					$scope.setProperty('application-created', {
						name: data.message,
						class: "fa-times"
					});
					return callback("");
				}

				$scope.setProperty('application-created', {
					name: "The Request has failed.",
					class: "fa-times"
				});

				$scope.status = "Could not Create Process";
				callback("");
			});
		}

		$scope.finishApplicationStep = function (application, callback) {
			$scope.setProperty('application-created', {
				name: "Application Created.",
				class: "fa-check"
			});

			callback(null, application);
		}

		$scope.createDomainStep = function (application, callback) {
			$scope.status = "Creating Domain..";
			$scope.setProperty('application-domain', {
				name: $scope.status,
				class: "fa-circle-o-notch fa-spin"
			});

			var data = {
				domain: {
					domain: application.app_url+'-'+user.user.username+'.ngapp.io',
					ssl: true,
					ssl_only: false
				}
			};

			var url = '/app/'+application.app_url+'/domain';

			$http.post(url, data).success(function(data, status) {
				if (data.status == 200) {
					callback(null, application, data.domain);
				} else {
					$scope.status = data.message;
					$scope.setProperty('application-domain', {
						name: data.message,
						class: "fa-times"
					});

					return callback("");
				}
			}).error(function() {
				$scope.status = "Domain Failed to Create due to an Unknown Issue.";
				$scope.setProperty('application-domain', {
					name: $scope.status,
					class: "fa-times"
				});
			})
		}

		$scope.finishDomainStep = function (application, domain, callback) {
			$scope.status = "Application Domain Created ("+domain+")";
			$scope.setProperty('application-domain', {
				name: $scope.status,
				class: "fa-check"
			});

			callback(null, application);
		}

		var steps = [
			$scope.createApplicationStep,
			$scope.finishApplicationStep,
			$scope.createDomainStep,
			$scope.finishDomainStep
		];

		if ($scope.app.template == 'ghost') {
			// Create a database..
			steps.push($scope.createDatabaseStep, $scope.finishDatabaseStep);
		}

		// Environment variables
		steps.push($scope.createEnvironmentStep, $scope.finishEnvironmentStep);
		// Create process
		steps.push($scope.createProcessStep, $scope.finishProcessStep);

		// Boot process
		steps.push($scope.bootProcessStep, $scope.finishBootStep);

		steps.push($scope.doneStep);

		async.waterfall(steps, function () {
			$scope.setProperty('finished', {
				name: "All Done :)",
				class: "fa-check"
			});
		})
	});

	app.registerController('AddAppController', function ($scope, $http, $rootScope, servers, user, $sce) {
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