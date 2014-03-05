define([
	'angular',
	'../app',
	'../controllers/tickets'
], function(angular, app) {
	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
		$stateProvider.state('tickets', {
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
	});
})