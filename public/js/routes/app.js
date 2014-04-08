define([
	'angular',
	'app',
	'../controllers/apps',
	'../controllers/addApp'
], function(angular, app) {
	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
		$stateProvider.state('add', {
			url: '/app/add',
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
				data: function($q, $http, $stateParams) {
					var deferred = $q.defer();
				
					$http.get('/app/'+$stateParams.id).success(function(data, status) {
						deferred.resolve(data)
					})
				
					return deferred.promise;
				}
			},
			controller: "AppController"
		})
		.state('app.dashboard', {
			url: '',
			pageTitle: "App Dashboard",
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/dashboard?partial=true"
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