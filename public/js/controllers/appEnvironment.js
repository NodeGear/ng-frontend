define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('AppEnvironmentController', function ($scope, $http, app) {
		$scope.environment = app.environment;

		$scope.app = app.app;
		$scope._app = app;

		app.getEnvironment(function() {
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		})
	})
	.controller('AppEnvironmentVariableController', function ($scope, $http, csrf, app, env, $state) {
		$scope.env = env.env;
		$scope.addEnvironment = $scope.env._id == null;
		$scope.checking = false;

		$("#environmentModal").modal('show')
		.on('hidden.bs.modal', function() {
			$state.transitionTo('app.environment', {
				id: app.app.nameUrl
			});
		});

		$scope.deleteEnv = function() {
			$scope.status = "Deleting Environment... ";

			$http.delete(app.appRoute+'/environment/'+$scope.env._id+'?_csrf='+csrf.csrf).success(function(data) {
				if (data.status == 200) {
					$scope.status = "Environment Deleted.";
					
					app.getEnvironment(function() {
						$("#environmentModal").modal('hide');
					});
				} else {
					$scope.status = data.message;
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			}).error(function() {
				$scope.status = "The Request has failed.";

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}

		$scope.saveEnvironment = function() {
			$scope.status = "Saving... "

			var data = {
				_csrf: csrf.csrf,
				env: $scope.env
			};
			var url = app.appRoute+'/environment';

			var promise = null;
			if ($scope.addEnvironment) {
				promise = $http.post(url, data);
			} else {
				promise = $http.put(url+'/'+data.domain._id, data);
			}

			promise.success(function(data, status) {
				if (data.status == 200) {
					if ($scope.addDomain) {
						$scope.status = "Environment Added ";
					} else {
						$scope.status = "Environment Saved ";
					}

					app.getEnvironment(function() {
						$("#environmentModal").modal('hide');
					})
				} else {
					$scope.status = data.message;
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			}).error(function() {
				$scope.status = "The Request has failed.";

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}
	})
});