require.config({
   baseUrl: '/js',
	paths: {
		angular: 'vendor/angular',
		uiRouter: 'vendor/angular-ui-router',
		jquery: 'vendor/jquery',
		moment: 'vendor/moment',
		'sb-admin': 'vendor/sb-admin',
		bootstrap: 'vendor/bootstrap'
	},
	shim: {
		angular: {
			exports: 'angular'
		},
		uiRouter: {
			deps: ['angular']
		},
		bootstrap: ['jquery'],
		'sb-admin': ['jquery'],
		'vendor/angular-sanitize': ['angular']
	}
});

require([
	'angular',
	'uiRouter',
	'vendor/angular-sanitize',
	'app',
	'bootstrap',
	'sb-admin',
	'controllers/auth'
], function(angular) {
	var $html = angular.element(document.getElementsByTagName('html')[0]);
	
	angular.element().ready(function() {
		angular.bootstrap($html, ['nodegear'])
	});
});