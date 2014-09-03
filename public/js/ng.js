require.config({
	paths: {
		angular: 'vendor/angular',
		uiRouter: '../vendor/angular-ui-router/release/angular-ui-router.min',
		jquery: 'vendor/jquery',
		d3: 'vendor/d3.min',
		moment: 'vendor/moment',
		bootstrap: 'vendor/bootstrap',
		couchPotato: '../vendor/angular-couch-potato/dist/angular-couch-potato'
		socketio: '/socket.io/socket.io.js',
		async: '../vendor/async/lib/async'
	},
	shim: {
		angular: {
			exports: 'angular'
		},
		socketio: {
			exports: 'io'
		},
		uiRouter: {
			deps: ['angular']
		},
		bootstrap: ['jquery'],
		'vendor/angular-sanitize': ['angular'],
		d3: {
			exports: 'd3'
		}
	}
});

require([
	'angular',
	'couchPotato',
	'uiRouter',
	'vendor/angular-sanitize',
	'app',
	'jquery',
	'routes/routes'
], function(angular) {
	var $html = angular.element(document.getElementsByTagName('html')[0]);
	
	angular.element().ready(function() {
		angular.bootstrap($html, ['nodegear']);
	});
});