define([
	'../app'
], function(app) {
	app.config(function($stateProvider, $couchPotatoProvider) {
		$stateProvider.state('profile', {
			url: '/profile',
			pageTitle: 'Profile',
			abstract: true,
			templateUrl: "/view/profile"
		})
		.state('profile.view', {
			url: '',
			pageTitle: 'Profile Settings',
			templateUrl: "/view/profile/settings",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/tfa', 'controllers/accountSettings'])
			}
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
			templateUrl: "/view/profile/billing/history",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/billingHistory', 'controllers/billingUsage'])
			}
		})
		.state('profile.billing.history.transaction', {
			url: '/transaction/:transaction_id',
			pageTitle: 'Billing Transactions',
			templateUrl: "/view/profile/billing/transaction",
			controller: "TransactionController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/transaction']),
				transaction: function($q, $http, $stateParams) {
					return $http.get('/profile/billing/transaction/'+$stateParams.transaction_id)
				}
			}
		})
		.state('profile.billing.addCredits', {
			url: '/credits/add',
			pageTitle: 'Add Credits',
			templateUrl: "/view/profile/billing/credits",
			controller: 'BillingCreditsController',
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/billingCredits', 'controllers/billingUsage'])
			}
		})
		.state('profile.billing.paymentMethods', {
			url: '/paymentMethods',
			pageTitle: 'Payment Methods',
			templateUrl: "/view/profile/billing/paymentMethods",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/billing', 'controllers/billingUsage'])
			}
		})
		.state('profile.billing.paymentMethods.add', {
			url: '/add',
			pageTitle: 'Add Payment Method',
			templateUrl: "/view/profile/billing/paymentMethod",
			controller: 'PaymentMethodController',
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/billing']),
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
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/billing']),
				paymentMethod: function($http, $q, $stateParams) {
					var promise = $q.defer();

					$http.get('/profile/card/'+$stateParams.card).success(function(data, status) {
						promise.resolve(data);
					})

					return promise.promise;
				}
			}
		})
		.state('profile.billing.usage', {
			url: '/usage',
			pageTitle: 'Spend Analysis',
			templateUrl: "/view/profile/billing/usage",
			controller: "BillingUsageController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/billingUsage'])
			}
		})
	});
});