require.config({
	paths: {
		angular: 'vendor/angular',
		uiRouter: 'vendor/angular-ui-router',
		jquery: 'vendor/jquery',
		d3: 'vendor/d3.min',
		moment: 'vendor/moment',
		bootstrap: 'vendor/bootstrap',
		couchPotato: 'vendor/angular-couch-potato',
		socketio: '/socket.io/socket.io.js',
		ga: '//www.google-analytics.com/analytics'
	},
	shim: {
		angular: {
			exports: 'angular'
		},
		socketio: {
			exports: 'io'
		},
		ga: {
			exports: 'ga'
		},
		uiRouter: {
			deps: ['angular']
		},
		bootstrap: ['jquery'],
		'vendor/angular-sanitize': ['angular'],
		d3: {
			exports: 'd3'
		},
		'vendor/flat-ui.combined': ['jquery']
	}
});

require([
	'angular',
	'couchPotato',
	'uiRouter',
	'vendor/angular-sanitize',
	'app',
	'jquery',
	'vendor/flat-ui.combined',
	'routes/routes'
], function(angular, ga) {
	require(['ga'], function (ga) {
		ga('create', 'UA-52383117-1', 'auto');
		ga('send', 'pageview');
	});

	var $html = angular.element(document.getElementsByTagName('html')[0]);
	
	angular.element().ready(function() {
		angular.bootstrap($html, ['nodegear']);
	});
});