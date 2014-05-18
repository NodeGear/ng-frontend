define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.registerController('AppSettingsController', function ($scope, $http, $state, app, csrf) {
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

		$scope.saveSettings = function() {
			$http.put(app.appRoute, {
				_csrf: csrf.csrf,
				name: app.app.name,
				location: app.app.location,
				script: app.app.script,
				branch: app.app.branch
			}).success(function(data) {
				$scope.status = data.message;
				app.app.nameUrl = data.nameUrl;
				app.appRoute = '/app/'+data.nameUrl;
			}).error(function() {
				$scope.status = "Request Failed";
			})
		}

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