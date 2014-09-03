define([
	'../app',
	'bugsnag'
], function(app, Bugsnag) {
	app.registerController('VerifyEmailController', function($scope, $http, $state) {
		$scope.status = "";
		$scope.csrf = "";
		$scope.codeTextTransform = "none";
		$scope.code = "";

		$scope.init = function () {
			$scope.status = "Loading Profile...";

			$http.get('/profile/profile').success(function(data, status) {
				if (data.status != 200) {
					return $state.transitionTo('login');
				}

				if (!data.user || !data.user.email) {
					if (Bugsnag) {
						Bugsnag.notify('Signup:Verify Loading /profile/profile email not present', data, 'warning');
					}
				}

				$scope.status = "We sent a token to "+data.user.email+".";
			}).error(function(data, status) {
				$state.transitionTo('login');

				if (typeof Bugsnag == 'undefined') return;
				Bugsnag.notify('Signup:Verify Error Loading /profile/profile', {
					data: data,
					status: status
				}, 'error');
			})
		}

		$scope.$watch('code', function() {
			if (typeof $scope.code != 'undefined' && $scope.code.length > 0) {
				$scope.codeTextTransform = 'uppercase';
			} else {
				$scope.codeTextTransform = 'none';
			}
		})
	
		$scope.verify = function() {
			$scope.status = "Authenticating TFA.."
			
			$http.post('/auth/verifyEmail', {
				code: $scope.code.toUpperCase()
			}).success(function (data, status) {
				analytics.track('signup email verification', {
					type: data.status == 200 ? 'success' : 'fail',
					status: data.status,
					message: data.message
				}, function () {
					if (data.status == 200) {
						window.location = "/&no_router";
					}
				});
				
				if (data.status != 200) {
					$scope.status = data.message;
				} else {
					$scope.status = "Verification Successful"
				}
			}).error(function (data, status) {
				$scope.status = "Sorry, That went wrong!. Try again or contact us."
			})
		}
	});
});