define([
	'angular',
	'../app',
	'../controllers/tfa'
], function(angular, app) {
	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
		$stateProvider.state('profile', {
			url: '/profile',
			abstract: true,
			templateUrl: "/profile?partial=true"
		})
		.state('profile.view', {
			url: '',
			templateUrl: "/profile/profile?partial=true"
		})
		.state('profile.ssh', {
			url: '/ssh',
			templateUrl: "/profile/ssh?partial=true"
		})
	});
});