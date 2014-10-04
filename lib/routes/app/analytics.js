var mongoose = require('mongoose'),
	models = require('ng-models'),
	fs = require('fs'),
	config = require('../../config'),
	util = require('../../util');

exports.router = function (app) {
	app.get('/app/:id/traffic', getAnalytics);
};

function getAnalytics (req, res, next) {
	var app = res.locals.app;
	models.Analytic.getAnalyticsForDrone(app, function(analytics) {
		res.locals.analytics = analytics;
		
		next();
	});
}