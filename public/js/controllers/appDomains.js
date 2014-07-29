define([
	'angular',
	'app',
	'moment'
], function(angular, app, moment) {
	app.registerController('AppDomainsController', function ($scope, $http, app) {
		$scope.domains = app.domains;

		$scope.app = app.app;
		$scope._app = app;

		app.getDomains(function() {
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		})
	})
	.registerController('AppDomainController', function ($scope, $http, csrf, user, app, domain, $state) {
		$scope.domain = domain.domain;
		$scope.addDomain = $scope.domain._id == null;
		$scope.checking = false;

		if ($scope.addDomain) {
			$scope.domain.is_subdomain = true;
			$scope.domain.domain = app.app.name+'-'+user.user.username+'.ngapp.io';
		}

		$("#domainModal").modal('show')
		.on('hidden.bs.modal', function() {
			$state.transitionTo('app.domains', {
				id: app.app.nameUrl
			});
		});

		$scope.deleteDomain = function() {
			$scope.status = "Deleting Domain... ";

			$http.delete(app.appRoute+'/domain/'+$scope.domain._id+'?_csrf='+csrf.csrf).success(function(data) {
				if (data.status == 200) {
					$scope.status = "Domain Deleted.";
					
					app.getDomains(function() {
						$("#domainModal").modal('hide');
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

		$scope.saveDomain = function() {
			$scope.status = "Checking Uniqueness... "

			var data = {
				_csrf: csrf.csrf,
				domain: $scope.domain
			};

			var url = app.appRoute+'/domain';

			var promise = null;
			if ($scope.addDomain) {
				promise = $http.post(url, data);
			} else {
				promise = $http.put(url+'/'+data.domain._id, data);
			}

			promise.success(function(data, status) {
				if (data.status == 200) {
					if ($scope.addDomain) {
						$scope.status = "Domain Added ";
					} else {
						$scope.status = "Domain Saved ";
					}

					app.getDomains(function() {
						$("#domainModal").modal('hide');
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