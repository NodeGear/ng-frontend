var conf = {
	version: "0.3.3"
};

require.config({
   baseUrl: '/js/'+conf.version,
	paths: {
		angular: 'vendor/angular',
		uiRouter: 'vendor/angular-ui-router',
		jquery: 'vendor/jquery',
		d3: 'vendor/d3.min',
		rickshaw: 'vendor/rickshaw.min',
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
		'vendor/angular-sanitize': ['angular'],
		d3: {
			exports: 'd3'
		},
		rickshaw: ['d3']
	}
});

require([
	'angular',
	'uiRouter',
	'vendor/angular-sanitize',
	'routes/routes',
	'app',
	'bootstrap',
	'sb-admin'
], function(angular) {
	var $html = angular.element(document.getElementsByTagName('html')[0]);
	
	angular.element().ready(function() {
		angular.bootstrap($html, ['nodegear']);
	});
});