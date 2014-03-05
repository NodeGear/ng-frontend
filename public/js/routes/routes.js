define([
	'angular',
	'/socket.io/socket.io.js',
	'../app',
	'app'
], function(angular, io, app) {
	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
		$locationProvider.html5Mode(true);
		
		socket = io.connect()
		
		$urlRouterProvider.otherwise('/')
		
		$stateProvider
		.state('gettingStarted', {
			url: '/',
			templateUrl: "/gettingStarted?partial=true"
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
			templateUrl: "/profile/profile?partial=true",
			controller: 'ProfileController'
		})
		.state('profile.ssh', {
			url: '/ssh',
			templateUrl: "/profile/ssh?partial=true"
		})
	
		.state('tickets', {
			url: '/tickets',
			abstract: true,
			controller: 'TicketsController',
			resolve: {
				data: function($q, $http) {
					var def = $q.defer();
				
					$http.get('/tickets').success(function(data, status) {
						def.resolve(data);
					});
				
					return def.promise;
				}
			},
			template: '<ui-view></ui-view>'
		})
		.state('tickets.tickets', {
			url: '',
			templateUrl: "/tickets/tickets?partial=true"
		})
		.state('tickets.add', {
			url: '/add',
			templateUrl: "/tickets/add?partial=true",
			controller: "TicketController",
			resolve: {
				data: function($q) {
					var def = $q.defer()
					def.resolve({});
					return def.promise;
				}
			}
		})
		.state('tickets.ticket', {
			url: '/:id',
			templateUrl: "/tickets/ticket?partial=true",
			controller: "TicketController",
			resolve: {
				data: function($q, $http, $stateParams) {
					var def = $q.defer();
				
					$http.get('/tickets/'+$stateParams.id).success(function(data, status) {
						def.resolve(data);
					})
				
					return def.promise;
				}
			}
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