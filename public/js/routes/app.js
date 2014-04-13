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
			templateUrl: "/app/add?partial=true",
			controller: "AddAppController"
		})
		.state('apps', {
			url: '/apps',
			pageTitle: "Applications",
			templateUrl: "/apps?partial=true",
			controller: "AppsController"
		})
		.state('app', {
			url: '/app/:id',
			pageTitle: "Application",
			abstract: true,
			templateUrl: "/app?partial=true",
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
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/dashboard?partial=true"
			}
		})
		.state('app.dashboard.addProcess', {
			url: '/process/new',
			pageTitle: 'Add Process',
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/process?partial=true"
			},
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
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/process?partial=true"
			},
			controller: "AppProcessController",
			resolve: {
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
		.state('app.logs', {
			url: '/log',
			pageTitle: "App Logs",
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/log?partial=true"
			}
		})
		.state('app.traffic', {
			url: '/traffic',
			pageTitle: "App Traffic",
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/traffic?partial=true"
			}
		})
		.state('app.usage', {
			url: '/usage',
			pageTitle: "App Usage",
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/usage?partial=true"
			}
		})
		.state('app.settings', {
			url: '/settings',
			pageTitle: "App Settings",
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/settings?partial=true"
			}
		})
	});
});