var mongoose = require('mongoose')
	, models = require('../../models')
	, fs = require('fs')
	, config = require('../../config')
	, drone = require('./drone')
	, util = require('../../util')

exports.router = function (app) {
	app.get('/app/:id/analytics', getAnalytics, viewAnalytics)
}

function getAnalytics (req, res, next) {
	var app = res.locals.app
	models.Analytic.getAnalyticsForDrone(app, function(analytics) {
		res.locals.analytics = analytics;
		
		next()
	})
}

function viewAnalytics (req, res) {
	res.render('app/analytics')
}