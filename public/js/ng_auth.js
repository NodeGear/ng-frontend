require.config({
	paths: {
		angular: 'vendor/angular',
		uiRouter: 'vendor/angular-ui-router',
		jquery: 'vendor/jquery',
		moment: 'vendor/moment',
		bootstrap: 'vendor/bootstrap',
		couchPotato: 'vendor/angular-couch-potato',
		ga: '//www.google-analytics.com/analytics',
		bugsnag: '//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.min'
	},
	shim: {
		angular: {
			exports: 'angular'
		},
		ga: {
			exports: 'ga'
		},
		bugsnag: {
			exports: 'Bugsnag'
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
	analytics.ready(function () {
		if (/(127.0.0.1)|(localhost)/.test(window.location.hostname)) {
			Bugsnag.releaseStage = 'development';
		}
		Bugsnag.notifyReleaseStages = ['production'];
	});
	
	var $html = angular.element(document.getElementsByTagName('html')[0]);
	
	angular.element().ready(function() {
		angular.bootstrap($html, ['nodegear'])
	});
});