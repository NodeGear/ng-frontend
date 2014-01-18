var mongoose = require('mongoose')
	, models = require('../../models')
	, fs = require('fs')
	, config = require('../../config')
	, drone = require('./drone')
	, util = require('../../util')

exports.router = function (app) {
	app.get('/app/:id/settings', viewSettings)
		.put('/app/:id', saveSettings)
}

function viewSettings (req, res) {
	res.render('app/settings')
}

function saveSettings (req, res) {
	var name = req.body.name;
	var env = req.body.env;
	
	var app = res.locals.app;
	
	if (name && name.length > 0) {
		// Safe!
		appname = name;
		
		req.session.flash = [util.buildFlash([], { class: "success", title: "Settings updated!" })];
	} else {
		req.session.flash = [util.buildFlash(["Incorrect name"], { class: "danger", title: "Cannot save app" })];
	}
	
	app.env = [];
	for (var i = 0; i < env.length; i++) {
		app.env.push({
			name: env[i].name,
			value: env[i].value,
			created: Date.now() // incorrect date (facepalm)
		});
	}
	
	app.save()
	
	res.format({
		html: function() {
			res.redirect('/app/'+res.locals.app._id+'/settings')
		},
		json: function() {
			res.send({
				status: 200,
				message: "Saved"
			})
		}
	})
}