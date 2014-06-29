define([
	'angular',
	'app',
	'moment',
	'socketio',
	'../services/app',
	'../directives/apps',
	'./appDashboard'
], function(angular, app, moment, io) {
	app.registerController('AppsController', function ($scope, $http, $rootScope) {
		$scope.appsOff = 0;
		$scope.appsOn = 0;

		var socket = io('/process_stats');

		$scope.columns = {};

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

				if (typeof $scope.columns[data._id] == 'undefined') {
					var processnum = 1;
					for (var p in $scope.columns) {
						if (!$scope.columns.hasOwnProperty(p)) continue;
						if ($scope.columns[p].app._id == app._id) {
							// This app has > 1 processes running..
							processnum++;
						}
					}
					
					$scope.columns[data._id] = {
						column: -1, // to be set
						processnum: processnum
					}
				}

				$scope.columns[data._id].data = data;
				$scope.columns[data._id].app = app;
				$scope.columns[data._id].stale = false;

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

		$scope.secondInterval = function () {
			var newRow = [new Date()];
			for (var o in $scope.columns) {
				if (!$scope.columns.hasOwnProperty(o)) continue;

				var col = $scope.columns[o];
				if (col.column == -1) {
					// Add to the table
					var processnum = col.processnum
					if (processnum == 1) {
						processnum = "";
					} else {
						processnum = ":" + processnum;
					}

					col.column = $scope.chart.data.addColumn('number', col.app.name + processnum + ' CPU Usage');
				}
				if (col.stale) {
					newRow.push(0);
					continue;
				}

				newRow.push(col.data.monitor.cpu_percent);
				col.stale = true;
			}

			if (newRow.length == 1) {
				// the graph doesn't have enough columns..
				return;
			}

			if ($scope.chart.data.getNumberOfRows() > 30) {
				$scope.chart.data.removeRow(0);
			}
			$scope.chart.data.insertRows($scope.chart.data.getNumberOfRows(), [newRow])
			$scope.chart.chart.draw($scope.chart.data, $scope.chart.options);

		}

		var secondInterval = setInterval($scope.secondInterval, 1000);

		socket.on('process_stats', $scope.process_stats);
		$scope.$on('$destroy', function() {
			socket.removeListener('process_stats', $scope.process_stats);
			clearInterval(secondInterval);
		});

		if (!$scope.apps) return;

		for (var i = 0; i < $scope.apps.length; i++) {
			if ($scope.apps[i].stopped == 0 && $scope.apps[i].running > 0) {
				$scope.appsOn++;
			} else {
				$scope.appsOff++;
			}

			if ($scope.apps[i].running > 0) {
				$scope.apps[i].isRunning = true;
			} else {
				$scope.apps[i].isRunning = false;
			}
		}
	});

	app.registerDirective('appsGraph', function () {
		return {
			restrict: 'A',
			scope: '@',
			link: function (scope, element, attrs) {
				// Create and populate the data table.
				var data = new google.visualization.DataTable();
				data.addColumn('date', 'Time');
				
				// Create and draw the visualization.
				var lineChart = new google.visualization.LineChart(element[0]);
				var options = {
					//curveType: "function",
					width: element[0].clientWidth,
					height: 400,
					vAxis: {
						minValue: 0,
						maxValue: 100
					}
				};

				//lineChart.draw(data, options);

				scope.chart = {
					data: data,
					chart: lineChart,
					options: options
				};
			}
		}
	})
});