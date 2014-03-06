define([
	'angular'
	], function(angular) {
		var app = angular.module('nodegear', ['ui.router', 'ngSanitize']);
		app.run(function($rootScope, $window) {
			$rootScope.$on('$locationChangeStart', function(event, newUrl, oldUrl){
				if (newUrl.match(/\&no_router/)) {
					event.preventDefault();
					$window.location.href = newUrl.replace(/\&no_router/, '');
				}
			});
		});
		
		return app;
	})