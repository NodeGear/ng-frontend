var models = require('../../models')
var app = require('../../app')

exports.router = function (app) {
	app.get('/admin/performance', getPerformance)
}

function getPerformance (req, res) {
	res.render('admin/monitor');
}

setInterval(function() {
	var now = new Date;

	models.NetworkPerformanceRaw.aggregate(
		{
			$match: {
				seconds: Math.round(now / 1000),
				responseStatus: 200
			}
		}
	).group({
		_id: '$seconds',
		totalRequests: {
			$sum: 1
		},
		averageLength: {
			$avg: '$responseLength'
		},
		minLength: {
			$min: '$responseLength'
		},
		maxLength: {
			$max: '$responseLength'
		},
		totalLength: {
			$sum: '$responseLength'
		},
		averageResponse: {
			$avg: '$responseTime'
		},
		responseMin: {
			$min: '$responseTime'
		},
		responseMax: {
			$max: '$responseTime'
		}
	}).exec(function(err, result) {
		if (err) throw err;

		models.NetworkPerformanceRaw.remove({
			seconds: {
				$lte: Math.round(now / 1000)
			}
		}, function(err) {
			if (err) throw err;
		})

		if (result.length == 0) return;
		
		var socks = app.io.sockets.clients();
		for (var sock in socks) {
			if (!socks.hasOwnProperty(sock)) {
				continue;
			}

			if (socks[sock].handshake.user.admin) {
				socks[sock].emit('performance', {
					perfs: result
				});
			}
		}
	})
}, 1000);