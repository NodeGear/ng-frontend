var mongoose = require('mongoose')
	, models = require('../../models')
	, fs = require('fs')
	, config = require('../../config')
	, drone = require('./drone')
	, util = require('../../util')

exports.router = function (app) {
	app.get('/app/:id/usage', getUsage, viewUsage)
}

function getUsage (req, res, next) {
	var app = res.locals.app
	models.Usage.getUsageForDrone(app._id, function(usage) {
		res.locals.usage = usage;
		
		next()
	})
}

function viewUsage (req, res) {
	if (req.query.partial) {
		res.render('app/usage')
		return;
	}
	
	res.send({
		usage: res.locals.usage
	})
}
