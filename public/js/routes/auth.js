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
			templateUrl: "/view/auth/login",
			controller: "SignInController"
		})
		.state('register', {
			url: '/register',
			pageTitle: "Register",
			templateUrl: "/view/auth/register",
			controller: "SignUpController"
		})
		.state('verifyEmail', {
			url: '/register/verify',
			pageTitle: "Verify Email",
			templateUrl: "/view/auth/verifyEmail",
			controller: "VerifyEmailController"
		})
		.state('forgot', {
			url: '/forgot',
			pageTitle: "Forgotten Password",
			templateUrl: "/view/auth/forgot",
			controller: "ForgotController"
		})
		.state('tfa', {
			url: '/tfa',
			pageTitle: "Two Factor Authentication",
			templateUrl: "/view/auth/tfa",
			controller: "TFAController"
		})
	});
});