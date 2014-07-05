angular.module('nodegear')

.controller('InvitationsController', function ($scope, $http, ngTableParams) {
	$scope.pendingInvitesTable = new ngTableParams({
		page: 1,
		count: 25,
		sorting: {
			created: 'desc'
		}
	}, {
		total: 0,
		getData: function($defer, params) {
			var qs = "?filter[isConfirmed]=&";
			var url = params.url();
			for (var k in url) {
				if (!url.hasOwnProperty(k)) {
					continue;
				}
				qs += ""+k+"="+url[k]+"&";
			}

			$http.get("/admin/invitations"+qs).success(function(data) {
				// update table params
				params.total(data.total);
				// set new data
				$defer.resolve(data.data);
			});
		}
	});

	$scope.invitesTable = new ngTableParams({
		page: 1,
		count: 25,
		sorting: {
			created: 'desc'
		}
	}, {
		total: 0,
		getData: function($defer, params) {
			var qs = "?filter[isConfirmed]=true&";
			var url = params.url();
			for (var k in url) {
				if (!url.hasOwnProperty(k)) {
					continue;
				}
				qs += ""+k+"="+url[k]+"&";
			}

			$http.get("/admin/invitations"+qs).success(function(data) {
				// update table params
				params.total(data.total);
				// set new data
				$defer.resolve(data.data);
			});
		}
	});
})