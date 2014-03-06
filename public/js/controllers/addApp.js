define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('AddAppController', function ($scope, $http, $rootScope, $sce) {
		$scope.template = 'ghost';
		
		$scope.creating = false;
		$scope.creationLog = $sce.trustAsHtml("...");
	})
});