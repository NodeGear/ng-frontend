var models = require('ng-models')

exports.router = function (app) {
	app.get('/analytics', showAnalytics)
}

var lastAverage = null;
var avg = {
	count: 0,
	total: 0,
	averageRequests: 0,
	totalSize: 0
};

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
		count: count,
		total: total,
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
		
		res.locals.allTotal = avg.count;
		res.locals.allAverage = avg.averageRequests
		res.locals.allSize = avg.totalSize
		if (res.locals.allSize > 0) {
			res.locals.allSize = res.locals.allSize / 1024 / 1024;
		}
		
		res.render('analytics/show')
	})
}

function updateAverage () {
	var search = {
	}
	
	if (lastAverage) {
		search.end = {
			$gte: lastAverage
		}
	}
	
	lastAverage = new Date();
	models.Analytic.find(search, function(err, all) {
		var calc = calculateAverage(all);
		
		avg.count += calc.count;
		avg.total += calc.total;
		avg.averageRequests = avg.total / avg.count;
		avg.totalSize += calc.totalSize;
	});
}

setInterval(updateAverage, 10 * 1000);
updateAverage();