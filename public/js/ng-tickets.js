angular.module('nodecloud')

.controller('TicketsController', function ($scope, data, $http, $rootScope) {
	$scope.tickets = data.tickets || [];
})

.controller('TicketController', function ($scope, data, $http, $rootScope) {
	$scope.app = data.app || {}
	$rootScope.app = {
		_id: data.app._id,
		name: data.app.name
	}
	
	for (var i = 0; i < $scope.app.events.length; i++) {
		$scope.app.events[i].created = moment($scope.app.events[i].created);
	}
	$scope.app.events.reverse();
	
	for (var i = 0; i < $scope.app.logs.length; i++) {
		$scope.app.logs[i].created = moment($scope.app.logs[i].created);
	}
	
	$scope.newEnv = {};
	
	$scope.log = null
	$scope.usage = [];
	
	$scope.setCsrf = function (csrf) {
		$scope.csrf = csrf;
	}
	
})