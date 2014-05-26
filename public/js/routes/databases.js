define([
	'../app'
], function(app) {
	app.config(function($stateProvider, $couchPotatoProvider) {
		$stateProvider.state('databases', {
			url: '/databases',
			pageTitle: 'Databases',
			templateUrl: "/view/databases",
			controller: 'DatabasesController',
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/databaseController'])
			}
		})
		.state('database_add', {
			url: '/database/add',
			pageTitle: 'Add Database',
			templateUrl: "/view/database/database",
			controller: 'DatabaseController',
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/databaseController']),
				database: function() {
					return {
						database_type: 'mongodb'
					}
				}
			}
		})

		.state('database_edit', {
			url: '/database/:database_id',
			pageTitle: 'Add Database',
			templateUrl: "/view/database/database",
			controller: 'DatabaseController',
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/databaseController']),
				database: function($q, $stateParams, $http) {
					var deferred = $q.defer();

					$http.get('/database/'+$stateParams.database_id).success(function(data) {
						deferred.resolve(data.database);
					})

					return deferred.promise;
				}
			}
		})
		
	});
});