define([
	'app',
	'../services/app'
], function(app) {
	app.config(function($stateProvider, $couchPotatoProvider) {
		$stateProvider.state('add', {
			url: '/apps/add',
			pageTitle: "Add Application",
			templateUrl: "/view/app/add",
			controller: "AddAppController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/addApp'])
			}
		})
		.state('apps', {
			url: '/apps',
			pageTitle: "Applications",
			templateUrl: "/view/apps",
			controller: "AppsController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/apps'])
			}
		})
		.state('app', {
			url: '/app/:id',
			pageTitle: "Application",
			abstract: true,
			templateUrl: "/view/app",
			resolve: {
				data: function($q, app, $stateParams) {
					var deferred = $q.defer();
				
					app.getApp($stateParams.id, function(app) {
						deferred.resolve(app);
					})
				
					return deferred.promise;
				}
			}
		})
		.state('app.processes', {
			url: '',
			pageTitle: "App Processes",
			templateUrl: "/view/app/processes",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appDashboard'])
			}
		})
		.state('app.processes.addProcess', {
			url: '/process/new',
			pageTitle: 'Add Process',
			templateUrl: "/view/app/process",
			controller: "AppProcessController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appDashboard']),
				process: function($q, $http, $stateParams) {
					return {
						process: {
							running: false,
							created: null
						}
					};
				}
			}
		})
		.state('app.prcoesses.editProcess', {
			url: '/process/:pid',
			pageTitle: 'Edit Process',
			templateUrl: "/view/app/process",
			controller: "AppProcessController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appDashboard']),
				process: function($q, $http, $stateParams) {
					var def = $q.defer();

					$http.get('/app/'+$stateParams.id+'/process/'+$stateParams.pid)
					.success(function(data) {
						def.resolve(data);
					})

					return def.promise;
				}
			}
		})
		.state('app.domains', {
			url: '/domains',
			pageTitle: 'App Domains',
			templateUrl: "/view/app/domains",
			controller: "AppDomainsController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appDomains'])
			}
		})
		.state('app.domains.addDomain', {
			url: '/add',
			pageTitle: 'Add App Domain',
			templateUrl: "/view/app/domain",
			controller: "AppDomainController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appDomains']),
				domain: function() {
					return { domain: {} };
				}
			}
		})
		.state('app.domains.editDomain', {
			url: '/:did',
			pageTitle: 'Edit App Domain',
			templateUrl: "/view/app/domain",
			controller: "AppDomainController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appDomains']),
				domain: function($q, $http, $stateParams) {
					var def = $q.defer();

					$http.get('/app/'+$stateParams.id+'/domain/'+$stateParams.did)
					.success(function(data) {
						def.resolve(data);
					})

					return def.promise;
				}
			}
		})
		.state('app.environment', {
			url: '/environment',
			pageTitle: 'App Environment',
			templateUrl: "/view/app/environment",
			controller: "AppEnvironmentController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appEnvironment'])
			}
		})
		.state('app.environment.addEnv', {
			url: '/add',
			pageTitle: 'Add App Environment Variable',
			templateUrl: "/view/app/editEnvironment",
			controller: "AppEnvironmentVariableController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appEnvironment']),
				env: function() {
					return { env: {} };
				}
			}
		})
		.state('app.environment.editEnv', {
			url: '/:eid',
			pageTitle: 'Edit App Environment Variable',
			templateUrl: "/view/app/editEnvironment",
			controller: "AppEnvironmentVariableController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appEnvironment']),
				env: function($q, $http, $stateParams) {
					var def = $q.defer();

					$http.get('/app/'+$stateParams.id+'/environment/'+$stateParams.eid)
					.success(function(data) {
						def.resolve(data);
					})

					return def.promise;
				}
			}
		})
		.state('app.logs', {
			url: '/logs',
			pageTitle: "App Logs",
			template: "<ui-view autoscroll='false'></ui-view>",
			controller: "AppLogsController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appLogs'])
			}
		})
		.state('app.logs.process', {
			url: '/:pid',
			pageTitle: "App Log from Process",
			templateUrl: "/view/app/logs",
			controller: "AppLogProcessController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appLogs']),
				process: function($stateParams) {
					return $stateParams.pid;
				}
			}
		})
		.state('app.logs.process.log', {
			url: '/:lid',
			pageTitle: "App Log from Process",
			templateUrl: "/view/app/log",
			controller: "AppLogController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appLogs']),
				log: function($stateParams) {
					return $stateParams.lid;
				}
			}
		})
		.state('app.traffic', {
			url: '/traffic',
			pageTitle: "App Traffic",
			templateUrl: "/view/app/traffic"
		})
		.state('app.usage', {
			url: '/usage',
			pageTitle: "App Usage",
			templateUrl: "/view/app/usage"
		})
		.state('app.settings', {
			url: '/settings',
			pageTitle: "App Settings",
			templateUrl: "/view/app/settings",
			controller: "AppSettingsController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/appSettings'])
			}
		})
	});
});