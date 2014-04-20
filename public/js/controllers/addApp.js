define([
	'angular',
	'app',
	'moment',
	'../services/csrf'
], function(angular, app, moment) {
	app.controller('AddAppController', function ($scope, $http, $rootScope, csrf) {
		$scope.creating = false;
		$scope.status = "";
		
		$scope.create = function () {
			$http.post('/apps/add', {
				_csrf: csrf.csrf,
				name: $scope.name,
				template: $scope.template,
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.creating = true;
					$scope.app_id = data.id;
					$scope.app_url = data.nameUrl;
				}
			})
		}
	})
});