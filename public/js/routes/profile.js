define([
	'angular',
	'../app',
	'../controllers/tfa',
	'../controllers/billing',
	'../controllers/billingHistory',
	'../controllers/billingUsage',
	'../controllers/billingCredits'
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
			abstract: true,
			templateUrl: "/profile/billing?partial=true"
		})
		.state('profile.billing.history', {
			url: '',
			templateUrl: "/profile/billing/history?partial=true"
		})
		.state('profile.billing.addCredits', {
			url: '/credits/add',
			templateUrl: "/profile/billing/credits?partial=true",
			controller: 'BillingCreditsController'
		})
		.state('profile.billing.paymentMethods', {
			url: '/paymentMethods',
			templateUrl: "/profile/billing/paymentMethods?partial=true"
		})
	});
});