define([
	'/socket.io/socket.io.js',
	'../app',
	'./app',
	'./tickets',
	'./profile',
	'./databases',
	'../services/user'
], function(io, app) {
	app.config(function($stateProvider, $urlRouterProvider, $locationProvider, $couchPotatoProvider) {
		$locationProvider.html5Mode(true);
		
		socket = io.connect()
		
		$urlRouterProvider.otherwise('');
		
		$stateProvider
		.state('gettingStarted', {
			url: '/',
			pageTitle: 'Getting Started',
			templateUrl: "/view/gettingStarted"
		})
		
		.state('logout', {
			url: '/logout',
			pageTitle: 'Log Out',
			controller: function($scope) {
				window.location = "/logout";
			}
		})
	})
	.run(function($rootScope, $state, $stateParams, $http, user) {
		$rootScope.$state = $state
		$rootScope.$stateParams = $stateParams

		user.getUser(function() {})
	
		$http.get('/apps').success(function(data, status) {
			$rootScope.apps = data.apps;
		})
	})
})