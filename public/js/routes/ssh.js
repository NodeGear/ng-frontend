define([
	'../app'
], function(app) {
	app.config(function($stateProvider, $couchPotatoProvider) {
		$stateProvider
		.state('ssh', {
			url: '/ssh',
			abstract: true,
			template: '<ui-view></ui-view>'
		})
		.state('ssh.keys', {
			url: '/keys',
			pageTitle: 'SSH Keys',
			templateUrl: "/view/ssh/keys",
			controller: 'KeysController',
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/sshKeysController'])
			}
		})
		.state('ssh.add', {
			url: '/add',
			pageTitle: 'Add Database',
			templateUrl: "/view/ssh/key",
			controller: 'KeyController',
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/sshKeysController']),
				key: function() {
					return {
					}
				}
			}
		})

		.state('ssh.edit', {
			url: '/:key_id',
			pageTitle: 'Edit Key',
			templateUrl: "/view/ssh/key",
			controller: 'KeyController',
			resolve: {
				dummy: $couchPotatoProvider.resolveDependencies(['controllers/sshKeysController']),
				key: function($q, $stateParams, $http) {
					var deferred = $q.defer();

					$http.get('/ssh/'+$stateParams.key_id).success(function(data) {
						deferred.resolve(data.key);
					})

					return deferred.promise;
				}
			}
		})
		
	});
});