var mongoose = require('mongoose')
	, models = require('../../models')
	, fs = require('fs')
	, config = require('../../config')
	, drone = require('./drone')
	, util = require('../../util')

exports.router = function (app) {
	app.get('/app/:id/settings', viewSettings)
		.post('/app/:id/settings', saveSettings)
}

function viewSettings (req, res) {
	res.render('app/settings')
}

function saveSettings (req, res) {
	var name = req.body.name;
	
	if (name && name.length > 0) {
		// Safe!
		res.locals.app.name = name;
		res.locals.app.save()
		
		req.session.flash = [util.buildFlash([], { class: "success", title: "Settings updated!" })];
	} else {
		req.session.flash = [util.buildFlash(["Incorrect name"], { class: "danger", title: "Cannot save app" })];
	}
	
	res.redirect('/app/'+res.locals.app._id+'/settings')
}