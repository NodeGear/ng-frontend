define([
	'app',
	'moment'
], function(app, moment) {
	app.registerController('TicketsController', ['$scope', 'data', function ($scope, data) {
		$scope.tickets = data.tickets || [];

		$scope.compileTime = function () {
			for (var i = 0; i < $scope.tickets.length; i++) {
				$scope.tickets[i].createdString = moment($scope.tickets[i].created).fromNow();
			}
		}

		$scope.compileTime();
		var compileTimeInterval = setInterval($scope.compileTime, 1000 * 60);
		$scope.$on('$destroy', function () {
			clearInterval(compileTimeInterval);
		});
	}])

	.registerController('TicketController', ['$scope', 'data', '$http', '$rootScope', '$state', function ($scope, data, $http, $rootScope, $state) {
		$scope.ticket = data.ticket || {}
		$scope.csrf = "";
		$scope.status = "";
		$scope.disableSend = false;

		var limit = 1024;

		$scope.compileTime = function () {
			$scope.ticket.createdString = moment($scope.ticket.created).fromNow();

			var msgs = $scope.ticket.messages;
			if (!msgs) return;

			for (var i = 0; i < msgs.length; i++) {
				msgs[i].createdString = moment(msgs[i].created).fromNow();
			}
		}
	
		$scope.createTicket = function () {
			if ($scope.ticket.message.length > limit) {
				$scope.status = "Message Too long.";
				return;
			}

			$scope.disableSend = true;
			$scope.status = "Sending...";

			$http.post('/tickets/add', {
				ticket: $scope.ticket
			}).success(function(data, status) {
				$scope.status = "Done.";
				$state.transitionTo('tickets.ticket', {
					id: data._id
				});
			}).error(function(data, status) {
				if (status >= 500) {
					$scope.status = "Server Error";
				} else {
					$scope.status = data.message;
				}

				$scope.disableSend = false;
			})
		}
	
		$scope.submitReply = function () {
			var text = $scope.reply;

			if (text.length > limit) {
				$scope.status = "Message Too long.";
				return;
			}

			$scope.disableSend = true;
			$scope.status = "Sending...";
			
			$http.put('/tickets/'+$scope.ticket._id, {
				_csrf: $scope.csrf,
				message: text
			}).success(function(data, status) {
				$scope.ticket.messages.push({
					created: (new Date()).toString(),
					message: text,
					user: $scope.ticket.user
				})
			
				$scope.reply = "";
				$scope.disableSend = false;
				$scope.status = "Reply Sent";
			}).error(function(data, status) {
				if (status >= 500) {
					$scope.status = "Server Error";
				} else {
					$scope.status = data.message;
				}

				$scope.disableSend = false;
			})
		}

		$scope.closeTicket = function () {
			$http.get('/tickets/'+$scope.ticket._id+'/close')
			.success(function (data) {
				$scope.ticket.closed = true;
				$scope.status = "Ticket Closed";
			})
		}

		$scope.compileTime();
		var compileTimeInterval = setInterval($scope.compileTime, 1000 * 60);
		$scope.$on('$destroy', function () {
			clearInterval(compileTimeInterval);
		});
	}]);
});