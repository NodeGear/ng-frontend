angular.module('nodegear')

.controller('UserController', function ($scope, $http) {
	$scope.csrf = "";
	$scope.user_id = "";
	$scope.user = {};
	$scope.status = "";

	$scope.init = function (csrf, userid) {
		$scope.csrf = csrf;
		$scope.user_id = userid;

		$scope.getUser();
	}

	$scope.getUser = function () {
		$http.get('/admin/user/'+$scope.user_id).success(function(data) {
			$scope.user = data.user;
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

.controller('UsersController', function ($scope, $http, ngTableParams) {
	$scope.users = [];

	$scope.tableParams = new ngTableParams({
		page: 1,            // show first page
		count: 20,          // count per page
		sorting: {
			created: 'desc'     // initial sorting
		}
	}, {
		total: 0,           // length of data
		getData: function($defer, params) {
			var qs = "?";
			var url = params.url();
			for (var k in url) {
				if (!url.hasOwnProperty(k)) {
					continue;
				}
				qs += ""+k+"="+url[k]+"&";
			}
			$http.get("/admin/users"+qs).success(function(data) {
				// update table params
				params.total(data.total);
				// set new data
				$defer.resolve(data.users);
			});
		}
	});
})