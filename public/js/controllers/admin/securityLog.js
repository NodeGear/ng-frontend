angular.module('nodegear')

.controller('SecLogCtrl', function ($scope, $http, ngTableParams) {
	$scope.tableParams = new ngTableParams({
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
			$http.get("/admin/securityLogs"+qs).success(function(data) {
				// update table params
				params.total(data.total);
				// set new data
				$defer.resolve(data.logs);
			});
		}
	});
})