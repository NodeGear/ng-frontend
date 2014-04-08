define([
	'angular',
	'../app',
	'../controllers/tfa',
	'../controllers/billing',
	'../controllers/billingHistory',
	'../controllers/billingUsage',
	'../controllers/billingCredits',
	'../controllers/transaction',
	'../controllers/accountSettings'
], function(angular, app) {
	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
		$stateProvider.state('profile', {
			url: '/profile',
			pageTitle: 'Profile',
			abstract: true,
			templateUrl: "/profile?partial=true"
		})
		.state('profile.view', {
			url: '',
			pageTitle: 'Profile Settings',
			templateUrl: "/profile/profile?partial=true"
		})
		.state('profile.ssh', {
			url: '/ssh',
			pageTitle: 'Profile SSH Key',
			templateUrl: "/profile/ssh?partial=true"
		})
		.state('profile.billing', {
			url: '/billing',
			pageTitle: 'Billing',
			abstract: true,
			templateUrl: "/profile/billing?partial=true"
		})
		.state('profile.billing.history', {
			url: '',
			pageTitle: 'Billing History',
			templateUrl: "/profile/billing/history?partial=true"
		})
		.state('profile.billing.history.transaction', {
			url: '/transaction/:transaction_id',
			pageTitle: 'Billing Transactions',
			templateUrl: "/profile/billing/transaction?partial=true",
			controller: "TransactionController",
			resolve: {
				transaction: function($q, $http, $stateParams) {
					return $http.get('/profile/billing/transaction/'+$stateParams.transaction_id)
				}
			}
		})
		.state('profile.billing.addCredits', {
			url: '/credits/add',
			pageTitle: 'Add Credits',
			templateUrl: "/profile/billing/credits?partial=true",
			controller: 'BillingCreditsController'
		})
		.state('profile.billing.paymentMethods', {
			url: '/paymentMethods',
			pageTitle: 'Payment Methods',
			templateUrl: "/profile/billing/paymentMethods?partial=true"
		})
	});
});