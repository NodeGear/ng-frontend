define([
	'angular',
	'app'
], function(angular, app) {
	app.config(function($stateProvider, $urlRouterProvider, $locationProvider, $couchPotatoProvider) {
		$locationProvider.html5Mode(true);

		$urlRouterProvider.otherwise('/');

		$stateProvider.state('login', {
			url: '/',
			pageTitle: "Sign In",
			templateUrl: "/view/auth/login",
			controller: "SignInController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/auth_login'])
			}
		})
		.state('register', {
			url: '/register',
			pageTitle: "Register",
			templateUrl: "/view/auth/register",
			controller: "SignUpController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/auth_register'])
			}
		})
		.state('verifyEmail', {
			url: '/register/verify',
			pageTitle: "Verify Email",
			templateUrl: "/view/auth/verifyEmail",
			controller: "VerifyEmailController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/auth_verify'])
			}
		})
		.state('forgot', {
			url: '/forgot',
			pageTitle: "Forgotten Password",
			templateUrl: "/view/auth/forgot",
			controller: "ForgotController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/auth_forgot'])
			}
		})
		.state('tfa', {
			url: '/tfa',
			pageTitle: "Two Factor Authentication",
			templateUrl: "/view/auth/tfa",
			controller: "TFAController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/tfa'])
			}
		})
		.state('resetPassword', {
			url: '/password/reset',
			pageTitle: "Password Reset",
			templateUrl: "/view/auth/passwordReset",
			controller: "PasswordResetController",
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/auth_passwordReset'])
			}
		})
		.state('invitation', {
			url: '/invitation',
			pageTitle: 'Invitation',
			templateUrl: '/view/invitation_thanks',
			controller: ['$rootScope', function ($rootScope) {
				$rootScope.bodyClass = 'body-success';
			}]
		})
	});
});