define([
	'angular',
	'app',
	'../controllers/auth_login',
	'../controllers/auth_register',
	'../controllers/auth_forgot',
	'../controllers/auth_verify',
	'../controllers/tfa'
], function(angular, app) {
	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
		$locationProvider.html5Mode(true);

		$urlRouterProvider.otherwise('/');

		$stateProvider.state('login', {
			url: '/',
			templateUrl: "/auth/page/login?partial=true",
			controller: "SignInController"
		})
		.state('register', {
			url: '/register',
			templateUrl: "/auth/page/register?partial=true",
			controller: "SignUpController"
		})
		.state('verifyEmail', {
			url: '/register/verify',
			templateUrl: "/auth/page/verifyEmail?partial=true",
			controller: "VerifyEmailController"
		})
		.state('forgot', {
			url: '/forgot',
			templateUrl: "/auth/page/forgot?partial=true",
			controller: "ForgotController"
		})
		.state('tfa', {
			url: '/tfa',
			templateUrl: "/auth/page/tfa?partial=true",
			controller: "TFAController"
		})
	});
});