define([
	'../app',
	'moment'
], function(app, moment) {
	app.registerController('ForgotController', function($scope, $http, $rootScope) {
		$scope.status = "";
		$scope.authDetail = "";
		$scope.csrf = "";
		$scope.authDetailDisabled = false;
	
		$scope.setCsrf = function (csrf) {
			$scope.csrf = csrf;
			$('form[name=forgot] input[type=email]').trigger('focus');
		}
	
		$scope.submitForgot = function() {
			$scope.status = "Loading.."

			$http.post('/auth/forgot', {
				_csrf: $scope.csrf,
				auth: $scope.authDetail
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = "Thanks, we've sent an email to the user matching the details provided."
					$scope.authDetail = "";
					$scope.authDetailDisabled = true;
				} else {
					$scope.status = data.message;
				}
			}).error(function (data, status) {
				if (status == 429) {
					$scope.status = data.message + ' Retry ' + moment(Date.now()+data.retry).fromNow();
				} else {
					$scope.status = status + ' Request Failed. Try again later.';
				}
			});
		}
	});
});