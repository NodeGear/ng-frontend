var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')

exports.router = function (app) {
	app.put('/app/:id', saveSettings)
}

function saveSettings (req, res) {
	var name = req.body.name;
	var env = req.body.env;
	
	var app = res.locals.app;
	
	if (name && name.length > 0) {
		// Safe!
		app.name = name;
		
		var event = new models.Event({
			name: "Settings",
			message: "Settings updated"
		});
		event.save()
		
		app.events.push(event._id)
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