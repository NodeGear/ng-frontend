var nodecloud = angular.module('nodecloud', ['ui.router'])

nodecloud.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
	$locationProvider.html5Mode(true);
	
	$urlRouterProvider.otherwise('/apps')
	
	$stateProvider
	.state('apps', {
		url: '/apps',
		resolve: {
			data: function($q, $http) {
				var deferred = $q.defer();
				
				$http.get('/apps').success(function(data, status) {
					deferred.resolve(data)
				})
				
				return deferred.promise;
			}
		},
		templateUrl: "/apps?partial=true",
		controller: "AppsController"
	})
	.state('analytics', {
		url: '/analytics',
		templateUrl: "/analytics?partial=true"
	})
	.state('profile', {
		url: '/profile',
		abstract: true,
		templateUrl: "/profile?partial=true"
	})
	.state('profile.profile', {
		url: '',
		templateUrl: "/profile/profile?partial=true"
	})
	.state('profile.ssh', {
		url: '/profile/ssh',
		templateUrl: "/profile/ssh?partial=true"
	})
	
	.state('add', {
		url: '/app/add',
		templateUrl: "/app/add?partial=true",
		controller: "AppController",
		resolve: {
			data: function ($q) {
				return {}
			}
		}
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
	.state('logout', {
		url: '/logout',
		controller: function($scope, $route) {
			$route.reload()
		}
	})
})
.run(function($rootScope, $state, $stateParams) {
	$rootScope.$state = $state
	$rootScope.$stateParams = $stateParams
})