define([
	'app',
	'../services/csrf'
], function(app) {
	app.registerController('KeysController', function ($scope, $http, csrf) {
		$http.get('/ssh/keys').success(function(data) {
			$scope.keys = data.keys;
		});

		$scope.status = "";

		$scope.systemKey = function (data) {
			if (data.system_key == true) {
				$scope.status = data.message;

				$http.get('/ssh/keys').success(function(data) {
					$scope.keys = data.keys;
					if (!$scope.$$phase) {
						$scope.$digest();
					}
				});

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			}
		}

		socket.on('git:install', $scope.systemKey);

		$scope.$on('$destroy', function() {
			socket.removeListener('git:install', $scope.systemKey);
		});

		$scope.generateSystemKey = function() {
			$http.put('/ssh/system', {
				_csrf: csrf.csrf
			}).success(function(data) {
				if (data.status == 200) {
					$scope.status = "Creating System Key";
				} else {
					$scope.status = data.message;
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}
	})

	app.registerController('KeyController', function ($scope, $http, $state, csrf, key) {
		var socket = io.connect();

		$scope.key = key;

		$scope.installKey = function (data) {
			if (data._id == $scope.key._id) {
				$scope.status = data.message;
				if (data.message == "Installation Finished") {
					// Close the modal.
					$('#keyModal').modal('hide')
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			}
		}

		socket.on('git:install', $scope.installKey);

		$scope.$on('$destroy', function() {
			socket.removeListener('git:install', $scope.installKey);
		});

		$scope.addKey = true;
		if (key._id) {
			$scope.addKey = false;
		}

		$scope.status = "";

		$('#keyModal').modal('show')
		.on('hidden.bs.modal', function() {
			$state.transitionTo('ssh.keys')
		});

		$scope.deleteKey = function() {
			$scope.status = "Deleting Key... ";

			$http.delete('/ssh/'+$scope.key._id+'?_csrf='+csrf.csrf).success(function(data) {
				if (data.status == 200) {
					$scope.status = "Key Deleted.";
					
					$("#keyModal").modal('hide');
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

		$scope.saveKey = function() {
			$scope.status = "Saving... "

			var data = {
				_csrf: csrf.csrf,
				key: $scope.key
			};
			var url = '/ssh';

			var promise = null;
			if ($scope.addKey) {
				promise = $http.post(url+'/key', data);
			} else {
				promise = $http.put(url+'/'+data.key._id, data);
			}

			promise.success(function(data, status) {
				if (data.status == 200) {
					if ($scope.addKey) {
						$scope.status = data.message;
						$scope.key._id = data.key_id;
					} else {
						$scope.status = "Key Saved ";
					}

					$scope.addKey = false;
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