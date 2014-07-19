define([
	'../app',
	'moment',
	'./tfa'
], function(app, moment) {
	app.registerController('SignUpController', ['$rootScope', '$scope', '$http', '$state', function($rootScope, $scope, $http, $state) {
		$scope.status = "";
		$scope.user = {};
		$scope.errors = {};

		$rootScope.bodyClass = '';

		var isLocalStorageCapable = false;
		try {
			isLocalStorageCapable = 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			isLocalStorageCapable = false;
		}

		$scope.resetUser = function() {
			$scope.user = {
				name: "",
				username: "",
				email: "",
				password: ""
			};
			$scope.errors = {};
		};

		$scope.init = function () {
			if (isLocalStorageCapable && localStorage["login_auth"]) {
				$scope.user.email = localStorage["login_auth"];
			}

			var email = (new RegExp("[\\?&]email=([^&#]*)")).exec(location.search);
			if (email && email.length > 0)
				$scope.user.email = email == null ? "" : decodeURIComponent(email[1]).replace(/\+/g, " ");
			var name = (new RegExp("[\\?&]name=([^&#]*)")).exec(location.search);
			$scope.user.name = name == null ? "" : decodeURIComponent(name[1]).replace(/\+/g, " ");

			setTimeout(function() {
				if (name != null) {
					$('form[name=register] input[ng-model="user.username"]').trigger('focus');
				} else {
					$('form[name=register] input[name=full_name]').trigger('focus');
				}
			}, 100);
		}

		$scope.registerUser = function () {
			$scope.status = "Registering..";
			
			$http.post('/auth/register', {
				_csrf: $scope.csrf,
				user: $scope.user
			}).success(function (data, status) {
				$scope.status = data.message;

				$scope.errors = {};
				
				analytics.alias(data._id);
				analytics.identify(data._id, {
					_id: data._id,
					name: $scope.user.name,
					username: $scope.user.username,
					email: $scope.user.email,
					createdAt: new Date,
					invitation: data.redirect_invitation
				});

				analytics.track('signup', {
					type: 'success'
				});

				if (data.redirect_invitation) {
					return $state.transitionTo('invitation');
				}
				
				$state.transitionTo('verifyEmail');
			}).error(function (data, status) {
				$scope.status = "";
				analytics.track('signup', {
					type: status == 400 ? 'fail' : 'error',
					status: status,
					data: data
				});

				if (status == 400) {
					$scope.errors = data.fields;
					$scope.taken = data.takenFields;
					return;
				}

				if (status == 429) {
					$scope.status = data.message + ' Retry ' + moment(Date.now()+data.retry).fromNow();
				} else {
					$scope.status = status + ' Request Failed. Try again later.';
				}
			});
		}

		$scope.resetUser();

		$scope.$watch('user.email', function(email) {
			if (isLocalStorageCapable) {
				if (typeof email !== 'undefined' && email.length > 0) {
					localStorage["login_auth"] = email;
				} else {
					localStorage["login_auth"] = "";
				}
			}
		});
	}]);
});