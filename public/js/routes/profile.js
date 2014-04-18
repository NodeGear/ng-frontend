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
			templateUrl: "/view/profile"
		})
		.state('profile.view', {
			url: '',
			pageTitle: 'Profile Settings',
			templateUrl: "/view/profile/settings"
		})
		.state('profile.ssh', {
			url: '/ssh',
			pageTitle: 'Profile SSH Key',
			templateUrl: "/view/profile/ssh"
		})
		.state('profile.billing', {
			url: '/billing',
			pageTitle: 'Billing',
			abstract: true,
			templateUrl: "/view/profile/billing"
		})
		.state('profile.billing.history', {
			url: '',
			pageTitle: 'Billing History',
			templateUrl: "/view/profile/billing/history"
		})
		.state('profile.billing.history.transaction', {
			url: '/transaction/:transaction_id',
			pageTitle: 'Billing Transactions',
			templateUrl: "/view/profile/billing/transaction",
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
			templateUrl: "/view/profile/billing/credits",
			controller: 'BillingCreditsController'
		})
		.state('profile.billing.paymentMethods', {
			url: '/paymentMethods',
			pageTitle: 'Payment Methods',
			templateUrl: "/view/profile/billing/paymentMethods"
		})
		.state('profile.billing.paymentMethods.add', {
			url: '/add',
			pageTitle: 'Add Payment Method',
			templateUrl: "/view/profile/billing/paymentMethod",
			controller: 'PaymentMethodController',
			resolve: {
				paymentMethod: function() {
					return {
						paymentMethod: {
							_id: ''
						}
					};
				}
			}
		})
		.state('profile.billing.paymentMethods.edit', {
			url: '/:card',
			pageTitle: 'Edit Payment Methods',
			templateUrl: "/view/profile/billing/paymentMethod",
			controller: 'PaymentMethodController',
			resolve: {
				paymentMethod: function($http, $q, $stateParams) {
					var promise = $q.defer();

					$http.get('/profile/card/'+$stateParams.card).success(function(data, status) {
						promise.resolve(data);
					})

					return promise.promise;
				}
			}
		})
	});
});