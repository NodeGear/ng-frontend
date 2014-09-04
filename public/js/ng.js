require.config({
	paths: {
		angular: '../vendor/angular/angular.min',
		uiRouter: '../vendor/angular-ui-router/release/angular-ui-router.min',
		jquery: '../vendor/jquery/dist/jquery.min',
		moment: '../vendor/moment/moment',
		bootstrap: '../vendor/bootstrap/dist/js/bootstrap.min',
		couchPotato: '../vendor/angular-couch-potato/dist/angular-couch-potato',
		bugsnag: '//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.min',
		'angular-sanitize': '../vendor/angular-sanitize/angular-sanitize.min',
		socketio: '/socket.io/socket.io.js',
		d3: '../vendor/d3/d3.min',
		async: '../vendor/async/lib/async'
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
		'angular-sanitize': ['angular'],
		socketio: {
			exports: 'io'
		},
		'vendor/angular-sanitize': ['angular'],
		d3: {
			exports: 'd3'
		}
	}
});

require([
	'jquery',
	'angular',
	'couchPotato',
	'uiRouter',
	'angular-sanitize',
	'app',
	'bootstrap',
	'routes/routes'
], function($, angular) {
	var $html = angular.element(document.getElementsByTagName('html')[0]);
	
	angular.element().ready(function() {
		angular.bootstrap($html, ['nodegear']);
	});
});