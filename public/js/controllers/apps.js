define([
	'angular',
	'app',
	'moment',
	'../services/app',
	'../directives/apps',
	'./appDashboard'
], function(angular, app, moment) {
	app.registerController('AppsController', function ($scope, $http, $rootScope) {
		$scope.appsOff = 0;
		$scope.appsOn = 0;

		var socket = io.connect();
		
		socket.emit('watch_processes', {
			watch: true
		});

		$scope.process_stats = function(data) {
			if (!$scope.apps) return;

			for (var i = 0; i < $scope.apps.length; i++) {
				var app = $scope.apps[i];

				if (!app.stat_processes) app.stat_processes = [];

				if (app._id != data.app) continue;

				var found = false;
				for (var x = 0; x < app.stat_processes.length; x++) {
					var stat = app.stat_processes[x];
					if (stat._id == data._id) {
						app.stat_processes[x] = data;
						found = app.stat_processes[x];
						break;
					}
				}

				if (!found) {
					app.stat_processes.push(data);
					found = data;
				}

				found.monitor.rssString = found.monitor.rss + ' KB';
				if (found.monitor.rss > 1024) {
					found.monitor.rssString = Math.round(found.monitor.rss / 1024) + ' MB';
				}
				if (found.monitor.rss > 1024 * 1024) {
					found.monitor.rssString = Math.round(found.monitor.rss / 1024 / 1024) + ' GB';
				}
			}

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		};

		socket.on('process_stats', $scope.process_stats);
		$scope.$on('$destroy', function() {
			socket.emit('watch_processes', { watch: false });
			socket.removeListener('watch_processes', $scope.process_stats);
		});

		if (!$scope.apps) return;

		for (var i = 0; i < $scope.apps.length; i++) {
			if ($scope.apps[i].stopped == 0 && $scope.apps[i].running > 0) {
				$scope.appsOn++;
			} else {
				$scope.appsOff++;
			}
		}
	});

	app.registerDirective('appProcessPie', function() {
		return {
			restrict: 'A',
			scope: {
				app: '=app'
			},
			link: function(scope, element, attrs) {
				require(['d3'], function(d3) {
					var radius = 39 / 2;
					var color = d3.scale.category20();

					var data = [{
						label: 'Stopped',
						value: scope.app.stopped
					}, {
						label: 'Running',
						value: scope.app.running
					}];

					if (scope.app.running == 0 && scope.app.stopped == 0) return;

					var pie = d3.layout.pie()
						.value(function(d) {
							return d.value;
						});

					var arc = d3.svg.arc()
						.innerRadius(radius / 2)
						.outerRadius(radius);

					var svg = d3.select(element[0])
						.data([data])
						.attr('width', 39)
						.attr('height', 39)
						.append('g')
						.attr('transform', 'translate('+radius+','+radius+')');

					var arcs = svg.selectAll("g.slice")
						.data(pie)
						.enter()
							.append('g')
							.attr('class', 'slice');
					
					arcs.append('path')
						.attr('fill', function(d, i) { return color(i); })
						.attr('d', arc);

				})
			}
		}
	})
});