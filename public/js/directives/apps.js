define([
	'angular',
	'app'
], function(angular, app) {
	function bindClick (fn) {
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', function() {
					fn(scope, element, attrs);
				})
			}
		}
	}

	app.directive('processStartup', function(){
		return bindClick(function(scope) {
			scope.startApp();
		})
	})
	.directive('processStop', function(){
		return bindClick(function(scope) {
			scope.stopApp();
		});
	})
	.directive('processRestart', function(){
		return bindClick(function(scope) {
			scope.restartApp();
		})
	})
	.directive('processScaleUp', function() {
		return bindClick(function(scope) {
			scope.addProcess();
		})
	})
	.directive('processScaleDown', function() {
		return bindClick(function(scope) {
			scope.removeProcess();
		})
	})
	.directive('appDelete', function(){
		return bindClick(function(scope) {
			scope.deleteApp();
		})
	})
});