var models = require('../models')

exports.router = function (app) {
	app.get('/analytics', showAnalytics)
}

function calculateAverage(data) {
	var total = 0;
	var count = 0;
	for (; count < data.length; count++) {
		var diff = data[count].end - data[count].start;
		total += diff;
	}
	return total / count
}

function showAnalytics (req, res) {
	models.Analytic.find({})
		.populate('drone').sort('-end').limit(100).exec(function(err, analytics) {
		if (err) throw err;
		res.locals.analytics = analytics;
		
		res.locals.average = calculateAverage(analytics)
		
		models.Analytic.find({}, function(err, all) {
			res.locals.allTotal = all.length;
			res.locals.allAverage = calculateAverage(all);
			
			res.render('analytics/show')
		})
	})
}