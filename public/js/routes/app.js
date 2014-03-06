define([
	'angular',
	'app',
	'../controllers/apps',
	'../controllers/addApp'
], function(angular, app) {
	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
		$stateProvider.state('add', {
			url: '/app/add',
			templateUrl: "/app/add?partial=true",
			controller: "AddAppController"
		})
		.state('app', {
			url: '/app/:id',
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
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/dashboard?partial=true"
			}
		})
		.state('app.logs', {
			url: '/log',
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/log?partial=true"
			}
		})
		.state('app.traffic', {
			url: '/traffic',
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/traffic?partial=true"
			}
		})
		.state('app.usage', {
			url: '/usage',
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/usage?partial=true"
			}
		})
		.state('app.settings', {
			url: '/settings',
			templateUrl: function($stateParams) {
				return "/app/"+$stateParams.id+"/settings?partial=true"
			}
		})
	});
});