define([
	'angular',
	'app'
], function(angular, app) {
	app.directive('appStart', function(){
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', scope.startApp)
			}
		}
	})
	.directive('appStop', function(){
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', scope.stopApp)
			}
		}
	})
	.directive('appRestart', function(){
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', scope.restartApp)
			}
		}
	})
	.directive('appInstall', function(){
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', scope.installApp)
			}
		}
	})
	.directive('appDelete', function(){
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				element.bind('click', scope.deleteApp)
			}
		}
	})
});