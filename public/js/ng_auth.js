require.config({
	paths: {
		angular: 'vendor/angular',
		uiRouter: 'vendor/angular-ui-router',
		jquery: 'vendor/jquery',
		moment: 'vendor/moment',
		bootstrap: 'vendor/bootstrap',
		couchPotato: 'vendor/angular-couch-potato'
	},
	shim: {
		angular: {
			exports: 'angular'
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
	var $html = angular.element(document.getElementsByTagName('html')[0]);
	
	angular.element().ready(function() {
		angular.bootstrap($html, ['nodegear'])
	});
});