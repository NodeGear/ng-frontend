angular.module('nodecloud')

.controller('TicketsController', function ($scope, data, $http) {
	$scope.tickets = data.tickets || [];
})

.controller('TicketController', function ($scope, data, $http, $rootScope) {
	$scope.ticket = data.ticket || {}
	$scope.csrf = "";
	$scope.status = "";
	$scope.ticket = {};
	$scope.disableSend = false;
	
	$scope.setCsrf = function (csrf) {
		$scope.csrf = csrf;
	}
	
	$scope.createTicket = function () {
		$scope.disableSend = true;
		$scope.status = "Sending...";
		$http.post('/tickets/add', {
			_csrf: $scope.csrf,
			ticket: $scope.ticket
		}).success(function(data, status) {
			if (data.status == 200) {
				$scope.status = "Done.";
			} else {
				$scope.status = data.message;
				$scope.disableSend = false;
			}
			
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		}).error(function(data) {
			$scope.disableSend = false;
			$scope.status = "Server Error"
		})
	}
})