var models = require('../models')

exports.router = function (app) {
	app.get('/analytics', showAnalytics)
}

function calculateAverage(data) {
	var total = 0;
	var count = 0;
	var totalSize = 0;
	
	for (; count < data.length; count++) {
		var diff = data[count].end - data[count].start;
		total += diff;
		
		totalSize += data[count].resSize;
	}
	return {
		averageRequests: total / count,
		totalSize: totalSize
	}
}

function showAnalytics (req, res) {
	models.Analytic.find({})
		.populate('drone').sort('-end').limit(100).exec(function(err, analytics) {
		if (err) throw err;
		res.locals.analytics = analytics;
		
		var results = calculateAverage(analytics);
		res.locals.average = results.averageRequests
		res.locals.size = results.totalSize
		if (res.locals.size > 0) {
			res.locals.size = res.locals.size / 1024 / 1024;
		}
		
		models.Analytic.find({}, function(err, all) {
			res.locals.allTotal = all.length;
			var results = calculateAverage(all);
			res.locals.allAverage = results.averageRequests
			res.locals.allSize = results.totalSize
			if (res.locals.allSize > 0) {
				res.locals.allSize = res.locals.allSize / 1024 / 1024;
			}
			
			res.render('analytics/show')
		})
	})
}