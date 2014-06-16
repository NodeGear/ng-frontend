var models = require('ng-models')
var app = require('../../app')

exports.router = function (app) {
	app.get('/admin/performance', getPerformance)
}

function getPerformance (req, res) {
	res.render('admin/monitor');
}

/*
setInterval(function() {
	var now = Math.round(new Date / 1000) - 1;

	models.NetworkPerformanceRaw.aggregate(
		{
			$match: {
				unix_seconds: now
			}
		}
	).group({
		_id: null,
		totalRequests: {
			$sum: 1
		},
		lagAverage: {
			$avg: '$lag'
		},
		lagMin: {
			$min: '$lag'
		},
		lagMax: {
			$max: '$lag'
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
		
		if (result.length == 0) return;
		
		result[0]._id = now;
		
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
}, 1000);*/