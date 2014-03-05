define([
	'angular',
	'uiRouter',
	'routes/routes'
	], function(angular) {
		var app = angular.module('nodegear', [
			'ui.router'
		]);
		
		app.value('$anchorScroll', angular.noop);
		
		return app;
	})