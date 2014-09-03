require.config({
	paths: {
		angular: '../vendor/angular/angular.min',
		uiRouter: '../vendor/angular-ui-router/release/angular-ui-router.min',
		jquery: '../vendor/jquery/dist/jquery.min',
		moment: '../vendor/moment/moment',
		bootstrap: '../vendor/bootstrap/dist/js/bootstrap.min',
		couchPotato: '../vendor/angular-couch-potato/dist/angular-couch-potato',
		bugsnag: '//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.min',
		'angular-sanitize': '../vendor/angular-sanitize/angular-sanitize.min'
	},
	shim: {
		angular: {
			exports: 'angular'
		},
		bugsnag: {
			exports: 'Bugsnag'
		},
		uiRouter: {
			deps: ['angular']
		},
		bootstrap: ['jquery'],
		'angular-sanitize': ['angular']
	}
});

require([
	'jquery',
	'angular',
	'couchPotato',
	'uiRouter',
	'angular-sanitize',
	'app',
	'routes/auth'
], function($, angular) {
	var $html = angular.element(document.getElementsByTagName('html')[0]);
	
	angular.element().ready(function() {
		angular.bootstrap($html, ['nodegear'])
	});
});