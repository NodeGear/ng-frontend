define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('AppSettingsController', function ($scope, $http, $state, app, csrf) {
		$scope.app = app.app;
		$scope._app = app;
		$scope.canDelete = false;
		$scope.deleteText = "Delete Application";

		app.getProcesses(function() {
			$scope.canDelete = true;
			for (var i = 0; i < app.processes.length; i++) {
				if (app.processes[i].running) {
					$scope.canDelete = false;
					break;
				}
			}

			$scope.reloadScope();
		});

		$scope.reloadScope = function() {
			if (!$scope.$$phase) $scope.$digest();
		}

		$scope.deleteApp = function() {
			if (!$scope.canDelete) return;

			$scope.canDelete = false;
			$scope.deleteText = "Deleting...";

			$http.delete(app.appRoute+'?_csrf='+csrf.csrf)
			.success(function(data) {
				if (data.status == 200) {
					$scope.deleteText = "App Deleted.";
					$scope.reloadScope();

					$state.transitionTo('apps');
				} else {
					$scope.deleteText = data.message;
					$scope.reloadScope();
				}
			}).error(function() {
				$scope.deleteText = "App Failed to Delete (Click to Retry)";
				$scope.canDelete = true;

				$scope.reloadScope();
			})
		}
	})
});