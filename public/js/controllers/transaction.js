define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('TransactionController', function ($scope, transaction, $state) {
		$scope.transaction = transaction.data.transaction;

		$("#transactionDetailsModal").modal('show')
		.on('hidden.bs.modal', function() {
			$state.transitionTo('profile.billing.history')
		})
	})
});