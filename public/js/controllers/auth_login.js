define([
	'../app',
	'moment'
], function(app, moment) {
	app.registerController('SignInController', ['$scope', '$rootScope', '$http', '$state', function($scope, $rootScope, $http, $state) {
		$scope.status = "";
		$scope.user = {
			auth: "",
			password: ""
		};
		$scope.csrf = "";
		$scope.loginFailed = false;
		$scope.loginFailedReason = "";
	
		$scope.setCsrf = function (csrf) {
			$scope.csrf = csrf;
		}
		
		$scope.authenticate = function(user) {
			$scope.forceShowStatus = false;
			$scope.status = "Authenticating..";
		
			var pwd = user.password;
			user.password = "";
			$scope.loginFailed = false;

			$http.post('/auth/password', {
				_csrf: $scope.csrf,
				auth: user.auth,
				password: pwd
			}).success(function(data, status) {
				data.type = data.status == 200 ? 'success' : 'fail';

				if (data.status == 200) {
					$rootScope.bodyClass = 'body-success';

					if (data.redirect_invitation && data.redirect_invitation == true) {
						return $state.transitionTo('invitation')
					}

					if (data.tfa) {
						analytics.track('login', data);

						// Requires tfa..
						$state.transitionTo('tfa')
						return;
					}
					if (!data.email_verification) {
						analytics.track('login', data);

						// Requires user to verify email
						return $state.transitionTo('verifyEmail');
					}
					if (data.passwordUpdateRequired) {
						analytics.track('login', data);

						return $state.transitionTo('resetPassword');
					}
					
					$scope.status = "Login Successful";
					analytics.track('login', data, function () {
						window.location = "/";
					});
				} else {
					analytics.track('login', data);

					$scope.status = "";
					$scope.loginFailedReason = data.message;
					$scope.loginFailed = true;
					$rootScope.bodyClass = 'body-error';
				}
			}).error(function (data, status) {
				analytics.track('login', {
					type: 'error',
					status: status,
					message: data.message
				});
				$rootScope.bodyClass = 'body-error';

				$scope.forceShowStatus = true;
				if (status == 429) {
					$scope.status = data.message + ' Retry ' + moment(Date.now()+data.retry).fromNow();
				} else {
					$scope.status = status + ' Request Failed. Try again later.';
				}
			});
		}
		
		var isLocalStorageCapable = false;
		try {
			isLocalStorageCapable = 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			isLocalStorageCapable = false;
		}

		if (isLocalStorageCapable && localStorage["login_auth"]) {
			$scope.user.auth = localStorage["login_auth"];
			$('form[name=login] input[type=password]').trigger('focus');
		} else {
			$('form[name=login] input[type=email]').trigger('focus');
		}
		
		$scope.$watch('user.auth', function(auth) {
			if (isLocalStorageCapable) {
				if (typeof auth !== 'undefined' && auth.length > 0) {
					localStorage["login_auth"] = auth;
				} else {
					localStorage["login_auth"] = "";
				}
			}
		});
		$scope.$watch('user.password', function(pwd) {
			$scope.loginFailed = false;
			$rootScope.bodyClass = '';
		})
	}]);
});