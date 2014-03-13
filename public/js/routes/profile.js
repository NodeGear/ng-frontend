define([
	'angular',
	'../app',
	'../controllers/tfa',
	'../controllers/billing',
	'../controllers/billingHistory',
	'../controllers/billingUsage'
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
		.state('profile.billing', {
			url: '/billing',
			templateUrl: "/profile/billing?partial=true"
		})
		.state('profile.paymentMethods', {
			url: '/paymentMethods',
			templateUrl: "/profile/paymentMethods?partial=true"
		})
	});
});