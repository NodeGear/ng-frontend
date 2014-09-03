define([
	'angular',
	'couchPotato'
	], function(angular, couchPotato) {
		var app = angular.module('nodegear', ['scs.couch-potato', 'ui.router', 'ngSanitize']);

		require(['bugsnag'], function (bugsnag) {
			bugsnag.apiKey = window.bugsnag_key;
		});
		
		couchPotato.configureApp(app);

		app.run(['$rootScope', '$window', '$couchPotato', function($rootScope, $window, $couchPotato) {
			app.lazy = $couchPotato;
			
			$rootScope.kiosk_enabled = false;
			$rootScope.toggleKiosk = function() {
				$rootScope.kiosk_enabled = !$rootScope.kiosk_enabled;
			}

			$rootScope.$on('$locationChangeStart', function(event, newUrl, oldUrl){
				if (newUrl.match(/\&no_router/)) {
					event.preventDefault();
					$window.location.href = newUrl.replace(/\&no_router/, '');
				}
			});

			$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) { 
				if (toState.pageTitle) {
					$rootScope.pageTitle = "Loading " + toState.pageTitle;
				} else {
					$rootScope.pageTitle = "Loading..";
				}
			});
			$rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams){
				if (toState.pageTitle) {
					$rootScope.pageTitle = toState.pageTitle;
				} else {
					$rootScope.pageTitle = "NodeGear Page";
				}
				
				setTimeout(function () {
					analytics.page($rootScope.pageTitle, {
						url: window.location.protocol + '//' + window.location.hostname + window.location.pathname + window.location.search,
						title: $rootScope.pageTitle
					});
				}, 100);
			})
		}]);
		
		return app;
	})