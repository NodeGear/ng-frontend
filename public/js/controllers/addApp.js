define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.controller('AddAppController', function ($scope, $http, $rootScope) {
		$scope.creating = false;
		$scope.status = "";
		
		$scope.create = function (csrf) {
			$http.post('/app/add', {
				_csrf: csrf,
				name: $scope.name,
				template: $scope.template,
				subdomain: $scope.subdomain
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.creating = true;
					$scope.drone = data.id;
				}
			})
		}
	})
});