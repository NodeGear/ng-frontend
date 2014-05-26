define([
	'app',
	'../services/csrf'
], function(app) {
	app.registerController('DatabasesController', function ($scope, $http, csrf) {
		$http.get('/databases').success(function(data) {
			$scope.databases = data.databases;
		})
	})

	app.registerController('DatabaseController', function ($scope, $http, $state, csrf, database) {
		$scope.database = database;

		$scope.addDatabase = true;
		if (database._id) {
			$scope.addDatabase = false;
		}

		$scope.status = "";

		$('#databaseModal').modal('show')
		.on('hidden.bs.modal', function() {
			$state.transitionTo('databases')
		});

		$scope.deleteDatabase = function() {
			$scope.status = "Deleting Database... ";

			$http.delete('/database/'+$scope.database._id+'?_csrf='+csrf.csrf).success(function(data) {
				if (data.status == 200) {
					$scope.status = "Database Deleted.";
					
					app.getEnvironment(function() {
						$("#databaseModal").modal('hide');
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

		$scope.saveDatabase = function() {
			$scope.status = "Saving... "

			var data = {
				_csrf: csrf.csrf,
				database: $scope.database
			};
			var url = '/database';

			var promise = null;
			if ($scope.addDatabase) {
				promise = $http.post(url, data);
			} else {
				promise = $http.put(url+'/'+data.database._id, data);
			}

			promise.success(function(data, status) {
				if (data.status == 200) {
					if ($scope.addDatabase) {
						$scope.status = "Database Created ";
					} else {
						$scope.status = "Database Saved ";
					}

					$scope.database = data.database;
					$scope.addDatabase = false;
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