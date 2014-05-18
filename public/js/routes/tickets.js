define([
	'../app'
], function(app) {
	app.config(function($stateProvider, $couchPotatoProvider) {
		$stateProvider.state('tickets', {
			url: '/tickets',
			pageTitle: 'Support Tickets',
			abstract: true,
			controller: 'TicketsController',
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/tickets']),
				data: function($q, $http) {
					var def = $q.defer();
			
					$http.get('/tickets').success(function(data, status) {
						def.resolve(data);
					});
			
					return def.promise;
				}
			},
			template: '<ui-view autoscroll="false"></ui-view>'
		})
		.state('tickets.tickets', {
			url: '',
			pageTitle: 'Support Tickets',
			templateUrl: "/view/tickets"
		})
		.state('tickets.add', {
			url: '/add',
			pageTitle: 'Create Support Ticket',
			templateUrl: "/view/tickets/add",
			controller: "TicketController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/tickets']),
				data: function($q) {
					var def = $q.defer()
					def.resolve({});
					return def.promise;
				}
			}
		})
		.state('tickets.ticket', {
			url: '/:id',
			pageTitle: 'Support Ticket',
			templateUrl: "/view/ticket",
			controller: "TicketController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/tickets']),
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