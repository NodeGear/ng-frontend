define([
	'angular',
	'app',
	'moment',
	'socketio',
	'../services/app',
	'../services/csrf',
	'../services/servers'
], function(angular, app, moment, io) {
	app.registerController('AppDashboardController', function ($scope, app, csrf, $rootScope) {
		$scope._app = app;
		$scope.app = app.app;

		app.getProcesses(function() {
			$scope.reloadScope();

			for (var i = 0; i < app.processes.length; i++) {
				app.processes[i].stat = {
					monitor: {
						cpu_percent: 0,
						cpu_percent_max: 100,
						rss: 0,
						rss_max: 262144,
						rssString: 'N/A'
					}
				}
			}

			app.getEvents(function() {
				$scope.reloadScope();
			});
		});

		$scope.processLog = function(data) {
			for (var i = 0; i < $scope._app.processes.length; i++) {
				if ($scope._app.processes[i]._id == data.pid) {
					var proc = $scope._app.processes[i];

					if (proc.watch_logs) {
						if (!proc.logs) proc.logs = [];

						proc.logs.splice(0, 0, data.log);
					}

					if (proc.log_to_status) {
						// When starting, log goes to status property
						proc.status = data.log.substr(0, 40);
					}

					$scope.reloadScope();

					return;
				}
			}
		}

		$scope.app_event = function(data) {
			if (data.app != $scope.app._id) {
				// Not for my eyes..
				return;
			}

			app.addEvent(data);

			$scope.reloadScope();
		}

		$scope.app_running = function(data) {
			if (data.app != $scope.app_id) {
				// Not in this app
				return;
			}

			for (var i = 0; i < app.processes.length; i++) {
				if (app.processes[i]._id == data._id) {
					app.processes[i].startStopDisabled = false;
					app.processes[i].running = data.running;
					break;
				}
			}

			$scope.reloadScope();
		}

		$scope.process_stats = function(data) {
			if (!$scope._app.processes) return;

			for (var i = 0; i < $scope._app.processes.length; i++) {
				var process = $scope._app.processes[i];

				if (process._id != data._id) continue;

				process.stat = data;

				process.stat.monitor.rssString = process.stat.monitor.rss + 'KB';
				if (process.stat.monitor.rss > 1024) {
					process.stat.monitor.rssString = Math.round(process.stat.monitor.rss / 1024) + 'MB';
				}
				if (process.stat.monitor.rss > 1024 * 1024) {
					process.stat.monitor.rssString = Math.round(process.stat.monitor.rss / 1024 / 1024) + 'GB';
				}

				process.stat.monitor.cpuString = (Math.round(process.stat.monitor.cpu_percent * 100) / 100).toFixed(2);
			}

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		};

		var process_stats = io('/process_stats')
			, app_running = io('/app_running')
			, app_event = io('/app_event')
			, process_log = io('/process_log')

		process_stats.on('process_stats', $scope.process_stats);
		process_log.on('process_log', $scope.processLog);
		app_event.on('app_event', $scope.app_event);
		app_running.on('app_running', $scope.app_running);

		$scope.$on('$destroy', function() {
			process_log.removeListener('process_log', $scope.processLog);
			app_event.removeListener('app_event', $scope.app_event);
			app_running.removeListener('app_running', $scope.app_running);
			process_stats.removeListener('process_stats', $scope.process_stats);
		})

		$scope.reloadScope = function() {
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		}

		$scope.startProcess = function(process) {
			process.startStopDisabled = true;
			process.log_to_status = true;

			process_log.emit('subscribe_log', {
				pid: process._id,
				id: app.app._id
			});

			app.startProcess(process, function(success, message) {
				process.startStopDisabled = true;

				if (success) {
					process.status = "Process Started";
				} else {
					process.status = message;
					process.log_to_status = false;
				}

				$scope.reloadScope();
			});
		}

		$scope.stopProcess = function(process) {
			process.startStopDisabled = true;
			process.log_to_status = true;

			process_log.emit('subscribe_log', {
				pid: process._id,
				id: app.app._id
			});

			app.stopProcess(process, function(success, message) {
				process.startStopDisabled = true;

				if (success) {
					process.status = "Process Stopped.";
				} else {
					process.status = message;
					process.log_to_status = false;
				}
				
				$scope.reloadScope();
			});
		}

		$scope.showLog = function(process) {
			// Show the logs here...
		}

		$scope.watchLog = function(process) {
			if (process.log_to_status) {
				process.log_to_status = false;

				process_log.emit('unsubscribe_log', {
					id: app.app._id,
					pid: process._id
				});

				process.status = "";
			} else {
				process.log_to_status = true;

				process_log.emit('subscribe_log', {
					id: app.app._id,
					pid: process._id
				});

				process.status = "Watching Process Log";
			}
		}
	});

	app.registerDirective('processGraph', function () {
		return {
			restrict: 'A',
			scope: {
				process: '=',
			},
			link: function (scope, element, attributes) {
				require(['d3'], function (d3) {
					var svg;
					var create = function () {
						svg = d3.select(element[0])
						var elem = svg[0][0];
						var width = elem.clientWidth;
						var height = elem.clientHeight;
						var radius = Math.min(width, height) / 2;

						var proc = [{
							type: 'usage',
							value: 0,
						}, {
							type: 'free',
							value: 100
						}];

						var pie = d3.layout.pie()
							.sort(null)
							.value(function(d) {
								return d.value;
							})

						var arc = d3.svg.arc()
							.innerRadius(radius - parseInt(attributes.thickness))
							.outerRadius(radius);

						var g = svg
							.append('g')
							.attr('width', width)
							.attr('height', height)
							.attr('transform', 'translate('+(width/2)+','+(height/2)+')');

						var path = g.selectAll('path')
							.data(pie(proc))
						.enter()
							.append('path');

						var colors = ['rgb(174,199,232)', '#1e76a5'];

						path
							.attr('fill', function (d, i) {
								if (d.data.type == 'free') return colors[0];
								else return colors[1];
							})
							.attr('d', arc)
							.each(function(d) {
								this._current = d;
							});

						scope.$watch('process.stat', function (newStat) {
							if (typeof newStat == 'undefined') return;

							proc[0].value = (newStat.monitor[attributes.type] / newStat.monitor[attributes.type+'_max']) * 100;
							proc[1].value = 100 - proc[0].value;

							path
								.data(pie(proc))
								.transition()
								.duration(200)
								.attrTween('d', function (a) {
									var i = d3.interpolate(this._current, a);
									this._current = i(0);
									return function(t) {
										return arc(i(t));
									}
								})
						});

						if (!scope.process.running) {
							path.attr('fill', '#CCC');
						}

						scope.$watch('process.running', function (running) {
							if (running) {
								path
									.transition()
									.duration(500)
									.attr('fill', function (d, i) {
										if (d.data.type == 'free') return colors[0];
										else return colors[1];
									})
							} else {
								path.transition().duration(500).attr('fill', '#CCC');
							}
						});
					}

					if (!attributes.small && !scope.process.showInfo) {
						return create();
					}

					// and here my watch begins
					var watch = scope.$watch('process.showInfo', watchFn);
					function watchFn (showInfo) {
						if (typeof showInfo == 'undefined' || !showInfo) {
							return;
						}

						if (attributes.small && showInfo) {
							create();
							// prevent further calls to create();
							create = function(){};

							// clears the $watch
							watch();
						}
					}
				})
			}
		}
	})

	app.registerController('AppProcessController', function ($scope, process, csrf, $http, $state, app, servers) {
		$scope.process = process.process;
		$scope.addProcess = false;
		$scope.status = "";

		if (!$scope.process._id) {
			$scope.addProcess = true;
		}

		$scope.servers = [];
		servers.getServers(function(servers) {
			$scope.servers = servers;

			if (!$scope.$$phase) {
				$scope.$digest();
			}
		})

		$("#processModal").modal('show')
		.on('hidden.bs.modal', function() {
			$state.transitionTo('app.processes', {
				id: app.app.nameUrl
			});
		});

		$scope.deleteProcess = function() {
			$scope.status = "Deleting... ";

			$http.delete(app.appRoute+'/process/'+$scope.process._id+'?_csrf='+csrf.csrf).success(function(data) {
				if (data.status == 200) {
					$scope.status = "Process Deleted.";
					
					app.getProcesses(function() {
						app.formatEvents();
						$("#processModal").modal('hide');
					})
				} else {
					$scope.status = data.message;
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			}).error(function() {
				$scope.status = "The Request has failed.";

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}

		$scope.saveProcess = function() {
			$scope.status = "Saving... "

			var data = {
				_csrf: csrf.csrf,
				process: $scope.process
			};
			var url = app.appRoute+'/process';

			var promise = null;
			if ($scope.addProcess) {
				promise = $http.post(url, data);
			} else {
				promise = $http.put(url+'/'+$scope.process._id, data);
			}

			promise.success(function(data, status) {
				if (data.status == 200) {
					if ($scope.addProcess) {
						$scope.status = "Process Added ";
					} else {
						$scope.status = "Process Saved ";
					}

					app.getProcesses(function() {
						app.formatEvents();
						$("#processModal").modal('hide');
					})
				} else {
					$scope.status = data.message;
				}

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			}).error(function() {
				$scope.status = "The Request has failed.";

				if (!$scope.$$phase) {
					$scope.$digest();
				}
			})
		}
	});
});