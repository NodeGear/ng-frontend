angular.module('nodecloud')

.controller('ProfileController', function ($scope, $http) {
	$scope.tfa = {
		hide: false,
		status: ""
	};
	
	$scope.enableTFA = function(csrf) {
		$scope.tfa.hide = true;
		$scope.tfa.status = "Enabling...";
		
		$http.put('/auth/tfa/enable', {
			_csrf: csrf
		}).success(function(data, status) {
			if (data.status == 200) {
				
			}
		})
	}
})