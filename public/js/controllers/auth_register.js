define([
	'../app',
	'moment',
	'./tfa'
], function(app, moment) {
	app.registerController('SignUpController', function($scope, $http, $state) {
		$scope.status = "";
		$scope.user = {};
		$scope.help_text = {};
		$scope.csrf = "";
		
		$scope.resetUser = function() {
			$scope.user = {
				name: "",
				username: "",
				email: "",
				password: ""
			};
			$scope.help_text = {};
		};

		$scope.init = function (csrf) {
			$scope.csrf = csrf;

			var email = (new RegExp("[\\?&]email=([^&#]*)")).exec(location.search);
			$scope.user.email = email == null ? "" : decodeURIComponent(email[1].replace(/\+/g, " "));
			var name = (new RegExp("[\\?&]name=([^&#]*)")).exec(location.search);
			$scope.user.name = name == null ? "" : decodeURIComponent(name[1].replace(/\+/g, " "));

			setTimeout(function() {
				if (name != null) {
					$('form[name=register] input[ng-model="user.username"]').trigger('focus');
				} else {
					$('form[name=register] input[name=full_name]').trigger('focus');
				}
			}, 100);
		}

		$scope.registerUser = function () {
			$scope.status = "Registering.."
			
			$scope.help_text = {};
			
			$http.post('/auth/register', {
				_csrf: $scope.csrf,
				user: $scope.user
			}).success(function(data, status) {
				if (data.status == 200) {
					$scope.status = data.message;
					if (data.redirect_invitation) {
						return $state.transitionTo('invitation');
					}
					$state.transitionTo('verifyEmail');
				} else {
					if (data.taken) {
						$scope.help_text = {};
						if (data.taken.username) {
							$scope.help_text.username = "Username is taken";
						}
						if (data.taken.email) {
							$scope.help_text.email = "Email is already in use";
						}
					}

					$scope.status = data.message;
				}

				var anal_data = {
					type: data.status == 200 ? 'success' : 'error'
				};
				if (data.status == 200) {
					analytics.alias(data._id);
					analytics.identify(data._id, {
						_id: data._id,
						name: $scope.user.name,
						username: $scope.user.username,
						email: $scope.user.email,
						createdAt: new Date
					});
				} else {
					anal_data.errors = data.taken;
					anal_data.message = data.message;
				}

				analytics.track('signup', anal_data);

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			}).error(function (data, status) {
				if (typeof analytics !== 'undefined') {
					analytics.track('signup', {
						type: failed,
						status: status,
						data: data
					});
				}

				if (status == 429) {
					$scope.status = data.message + ' Retry ' + moment(Date.now()+data.retry).fromNow();
				} else {
					$scope.status = status + ' Request Failed. Try again later.';
				}
			});
		}

		$scope.resetUser();
	});
});