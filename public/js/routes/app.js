define([
	'angular',
	'app',
	'../controllers/apps',
	'../controllers/addApp',
	'../controllers/appDashboard',
	'../services/app'
], function(angular, app) {
	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
		$stateProvider.state('add', {
			url: '/apps/add',
			pageTitle: "Add Application",
			templateUrl: "/view/app/add",
			controller: "AddAppController"
		})
		.state('apps', {
			url: '/apps',
			pageTitle: "Applications",
			templateUrl: "/view/apps",
			controller: "AppsController"
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
		.state('app.dashboard', {
			url: '',
			pageTitle: "App Dashboard",
			templateUrl: "/view/app/dashboard"
		})
		.state('app.dashboard.addProcess', {
			url: '/process/new',
			pageTitle: 'Add Process',
			templateUrl: "/view/app/process",
			controller: "AppProcessController",
			resolve: {
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
		.state('app.dashboard.editProcess', {
			url: '/process/:pid',
			pageTitle: 'Edit Process',
			templateUrl: "/view/app/process",
			controller: "AppProcessController",
			resolve: {
				process: function($q, $http, $stateParams, app) {
					var def = $q.defer();

					$http.get('/app/'+$stateParams.id+'/process/'+$stateParams.pid)
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
			templateUrl: "/view/app/logs"
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
			templateUrl: "/view/app/settings"
		})
	});
});