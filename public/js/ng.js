require.config({
   baseUrl: '/js',
	paths: {
		angular: 'vendor/angular',
		uiRouter: 'vendor/angular-ui-router'
	},
	shim: {
		angular: {
			exports: 'angular'
		},
		uiRouter: {
			deps: ['angular']
		}
	}
});

require([
	'angular',
	'uiRouter',
	'routes/routes',
	'app'
], function(angular) {
	var $html = angular.element(document.getElementsByTagName('html')[0]);
	
	angular.element().ready(function() {
		angular.bootstrap($html, ['nodegear']);
	});
});