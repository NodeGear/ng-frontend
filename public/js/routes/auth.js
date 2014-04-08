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
			pageTitle: "Sign In",
			templateUrl: "/auth/page/login?partial=true",
			controller: "SignInController"
		})
		.state('register', {
			url: '/register',
			pageTitle: "Register",
			templateUrl: "/auth/page/register?partial=true",
			controller: "SignUpController"
		})
		.state('verifyEmail', {
			url: '/register/verify',
			pageTitle: "Verify Email",
			templateUrl: "/auth/page/verifyEmail?partial=true",
			controller: "VerifyEmailController"
		})
		.state('forgot', {
			url: '/forgot',
			pageTitle: "Forgotten Password",
			templateUrl: "/auth/page/forgot?partial=true",
			controller: "ForgotController"
		})
		.state('tfa', {
			url: '/tfa',
			pageTitle: "Two Factor Authentication",
			templateUrl: "/auth/page/tfa?partial=true",
			controller: "TFAController"
		})
	});
});