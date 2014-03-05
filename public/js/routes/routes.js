define([
	'angular',
	'/socket.io/socket.io.js',
	'../app',
	'./app',
	'./tickets',
	'./profile'
], function(angular, io, app) {
	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
		$locationProvider.html5Mode(true);
		
		socket = io.connect()
		
		$urlRouterProvider.otherwise('')
		
		$stateProvider
		.state('gettingStarted', {
			url: '/',
			templateUrl: "/gettingStarted?partial=true"
		})
		.state('analytics', {
			url: '/analytics',
			templateUrl: "/analytics?partial=true"
		})
		
		.state('logout', {
			url: '/logout',
			controller: function($scope, $route) {
				$route.reload()
				window.location = "/logout";
			}
		})
	})
	.run(function($rootScope, $state, $stateParams, $http) {
		$rootScope.$state = $state
		$rootScope.$stateParams = $stateParams
	
		$http.get('/apps').success(function(data, status) {
			$rootScope.apps = data.apps;
		})
	})
})