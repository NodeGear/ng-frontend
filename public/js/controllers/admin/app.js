angular.module('nodegear')

.controller('AppController', function ($scope, $http) {
	$scope.id = "";
	$scope.app = {};
	$scope.status = "";

	$scope.init = function (id) {
		$scope.id = id;

		$scope.get();
	}

	$scope.get = function () {
		$http.get('/admin/app/'+$scope.id)
		.success(function(data) {
			$scope.app = data.app;
		})
	}

	$scope.save = function () {
		$http.put('/admin/user/'+$scope.user_id, {
			_csrf: $scope.csrf,
			user: $scope.user
		}).success(function() {
			$scope.status = "User Saved."
		})
	}
})

.controller('AppsController', function ($scope, $http, ngTableParams) {
	$scope.applicationsTable = new ngTableParams({
		page: 1,
		count: 25,
		sorting: {
			created: 'desc'
		}
	}, {
		total: 0,
		getData: function($defer, params) {
			var qs = "?";
			var url = params.url();
			for (var k in url) {
				if (!url.hasOwnProperty(k)) {
					continue;
				}
				qs += ""+k+"="+url[k]+"&";
			}
			$http.get("/admin/apps"+qs).success(function(data) {
				// update table params
				params.total(data.total);
				// set new data
				$defer.resolve(data.apps);
			});
		}
	});
})