require.config({
	paths: {
		angular: 'vendor/angular',
		uiRouter: 'vendor/angular-ui-router',
		jquery: 'vendor/jquery',
		moment: 'vendor/moment',
		bootstrap: 'vendor/bootstrap',
		couchPotato: 'vendor/angular-couch-potato',
		ga: '//www.google-analytics.com/analytics'
	},
	shim: {
		angular: {
			exports: 'angular'
		},
		ga: {
			exports: 'ga'
		},
		uiRouter: {
			deps: ['angular']
		},
		bootstrap: ['jquery'],
		'vendor/angular-sanitize': ['angular'],
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
	'routes/auth'
], function(angular) {
	require(['ga'], function (ga) {
		ga('create', 'UA-52383117-1', 'auto');
		ga('send', 'pageview');
	});

	var $html = angular.element(document.getElementsByTagName('html')[0]);
	
	angular.element().ready(function() {
		angular.bootstrap($html, ['nodegear'])
	});
});