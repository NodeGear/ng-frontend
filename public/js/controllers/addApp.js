define([
	'app',
	'async',
	'../services/servers',
	'../services/user'
], function(app, async) {
	app.registerController('CreateAppStepCtrl', function ($scope, servers) {
		$scope.step = 0;

		$scope.app = {};
		$scope.servers = [];
		$scope.cannotStart = false;
		$scope.cannotStartReason = "";

		servers.getServers(function(servers) {
			$scope.servers = servers;
			try {
				if (!$scope.app.server) {
					$scope.app.server = $scope.servers[0]._id;
					$scope.selectedServer();
				}
			} catch (e) {}
		});

		$scope.getServer = function (id) {
			for (var i = 0; i < $scope.servers.length; i++) {
				if ($scope.servers[i]._id == id) {

					$scope.servers[i].overCapacity = false;
					if ($scope.servers[i].appsRunning > $scope.servers[i].appLimit) {
						$scope.servers[i].overCapacity = true;
					}

					return $scope.servers[i];
				}
			}
		}

		$scope.selectedServer = function () {
			var server = $scope.getServer($scope.app.server);

			if (server.overCapacity) {
				$scope.cannotStart = true;
				$scope.cannotStartReason = "Server Over Capacity";
			} else {
				$scope.cannotStart = false;
				$scope.cannotStartReason = "";
			}
		}

		$scope.getSpacesLeft = function (server_id) {
			server = $scope.getServer(server_id);
			if (!server) return;

			var spaces = server.appLimit - server.appsRunning;
			if (spaces < 0) spaces = 0;

			return spaces;
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
				$scope.app.nameUrl = data.nameUrl;

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
					domain: application.nameUrl+'-'+user.user.username+'.ngapp.io',
					ssl: true,
					ssl_only: false
				}
			};

			var url = '/app/'+application.nameUrl+'/domain';

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

				callback("");
			})
		}

		$scope.finishDomainStep = function (application, domain, callback) {
			$scope.status = "Application Domain Created ("+domain+")";
			$scope.setProperty('application-domain', {
				name: $scope.status,
				class: "fa-check"
			});

			callback(null, application, domain);
		}

		$scope.createDatabaseStep = function (application, domain, callback) {
			$scope.status = "Creating Database..";
			$scope.setProperty('database', {
				name: $scope.status,
				class: "fa-circle-o-notch fa-spin"
			});

			$http.post('/database', {
				database: {
					name: application.nameUrl,
					database_type: 'mysql'
				}
			})
			.success(function (data) {
				callback(null, application, domain, data.database);
			})
			.error(function (data) {
				$scope.status = "Database Failed to Create due to an Unknown Issue.";
				$scope.setProperty('database', {
					name: $scope.status,
					class: "fa-times"
				});

				callback("");
			})
		}

		$scope.finishDatabaseStep = function (application, domain, database, callback) {
			$scope.status = "MySQL Database Created.";
			$scope.setProperty('database', {
				name: $scope.status,
				class: "fa-check"
			});

			callback(null, application, domain, database);
		}

		$scope.createEnvironmentStep = function (application, domain, database, callback) {
			$scope.status = "Configuring Environment..";
			$scope.setProperty('environment', {
				name: $scope.status,
				class: "fa-circle-o-notch fa-spin"
			});

			var envs = [
				['DATABASE', 'true'],
				['DATABASE_HOST', database.db_host],
				['DATABASE_USER', database.db_user],
				['DATABASE_PASSWORD', database.db_pass],
				['DATABASE_NAME', database.db_name],
				['DOMAIN', domain],
				['USE_HTTPS', '1'],
				['NODE_ENV', 'production']
			];

			async.each(envs, function (env, done) {
				var data = {
					env: {
						name: env[0],
						value: env[1]
					}
				};

				$http.post('/app/'+application.nameUrl+'/environment', data)
				.success(function () {
					done();
				})
				.error(function (data, status) {
					done(status);
				});
			}, function (err) {
				if (err) {
					$scope.status = "Environment Failed to Configure due to an Unknown Issue. (Error "+err+")";
					$scope.setProperty('environment', {
						name: $scope.status,
						class: "fa-times"
					});

					return callback(err);
				}

				callback(null, application, domain, database);
			});
		}

		$scope.finishEnvironmentStep = function (application, domain, database, callback) {
			$scope.status = "Environment Configured.";
			$scope.setProperty('environment', {
				name: $scope.status,
				class: "fa-check"
			});

			callback(null, application, domain);
		}

		$scope.createProcessStep = function (application, domain, callback) {
			$scope.status = "Creating a Process..";
			$scope.setProperty('process-create', {
				name: $scope.status,
				class: "fa-circle-o-notch fa-spin"
			});

			var data = {
				process: {
					name: $scope.app.name,
					server: $scope.app.server
				}
			};
			var url = '/app/'+ application.nameUrl +'/process';

			$http.post(url, data).success(function(data, status) {
				if (data.status != 200) {
					$scope.status = data.message;
					$scope.setProperty('process-create', {
						name: data.message,
						class: "fa-times"
					});

					return callback(data.message);
				}

				callback(null, application, domain, data.process);
			}).error(function() {
				$scope.status = "Process Failed to Create due to an Unknown Issue";
				$scope.setProperty('process-create', {
					name: $scope.status,
					class: "fa-times"
				});

				return callback(err);
			});
		}

		$scope.finishProcessStep = function (application, domain, process, callback) {
			$scope.status = "Process Created.";

			$scope.setProperty('process-create', {
				name: $scope.status,
				class: "fa-check"
			});

			callback(null, application, domain, process);
		}

		$scope.bootProcessStep = function (application, domain, process, callback) {
			$scope.status = "Booting a Process..";
			$scope.setProperty('process-boot', {
				name: $scope.status,
				class: "fa-circle-o-notch fa-spin"
			});

			$http.post('/app/'+ application.nameUrl +'/process/'+ process +'/start')
			.success(function(data) {
				if (data.status == 200) {
					callback(null, application, domain, process);
				} else {
					$scope.status = "Process Failed to start.";
					$scope.setProperty('process-boot', {
						name: $scope.status,
						class: "fa-times"
					});

					callback($scope.status);
				}
			}).error(function() {
				$scope.status = "Failed to Create Process";
				$scope.setProperty('process-boot', {
					name: $scope.status,
					class: "fa-times"
				});

				callback('')
			});
		}

		$scope.finishBootStep = function (application, domain, process, callback) {
			$scope.status = "Process Start Scheduled.";
			$scope.setProperty('process-boot', {
				name: $scope.status,
				class: "fa-check"
			});

			callback(null, application, domain, process);
		}

		$scope.doneStep = function (application, domain, process, callback) {
			$scope.status = "Application Created.";

			$scope.setProperty('finished', {
				name: $scope.status,
				class: "fa-check"
			});
			$scope.isCreated = true;

			callback(null);
		}

		$scope.delayStep = function () {
			// Convert arguments to a real array
			var args = Array.prototype.slice.call(arguments);

			// Pop the callback argument (its always last)
			var callback = args.pop();

			// The error argument
			args.splice(0, 0, null);

			setTimeout(function() {
				callback.apply(this, args);
			}, 1000);
		}

		var steps = [
			$scope.createApplicationStep, $scope.delayStep,
			$scope.finishApplicationStep,
			$scope.createDomainStep, $scope.delayStep,
			$scope.finishDomainStep
		];

		if ($scope.app.template == 'ghost') {
			// Create a database..
			steps.push($scope.createDatabaseStep, $scope.delayStep, $scope.finishDatabaseStep);

			// Environment variables
			steps.push($scope.createEnvironmentStep, $scope.delayStep, $scope.finishEnvironmentStep);
		}

		// Create process
		steps.push($scope.createProcessStep, $scope.delayStep, $scope.finishProcessStep);

		// Boot process
		steps.push($scope.bootProcessStep, $scope.delayStep, $scope.finishBootStep);

		steps.push($scope.doneStep);

		async.waterfall(steps, function (err) {
			if (err) {
				$scope.setProperty('finished', {
					name: "App Creation Failed. "+err,
					class: "fa-times"
				});
			} else {
				$scope.setProperty('finished', {
					name: "All Done :)",
					class: "fa-check"
				});
			}

			$scope.isDone = true;

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		});
	});
});
