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
	var location = req.body.location;
	var branch = req.body.branch;
	var script = req.body.script;
	
	var app = res.locals.app;
	
	var errs = [];

	if (name && name.length > 0) {
		app.name = name;
		app.nameLowercase = name.toLowerCase();
		app.nameUrl = name.replace(/\W+/g, '-').trim().toLowerCase();
	} else {
		errs.push("Name Invalid.")
	}
	
	if (location && location.length > 0) {
		app.location = location;
	} else {
		errs.push("Location Invalid");
	}
	
	if (branch && branch.length > 0) {
		app.branch = branch;
	} else {
		errs.push("Branch Invalid");
	}
	
	if (script && script.length > 0) {
		app.script = script;
	} else {
		errs.push("Script Invalid");
	}

	app.save()
	
	res.send({
		status: errs.length > 0 ? 200 : 400,
		message: errs.length > 0 ? "Saved" : errs.join(', '),
		nameUrl: app.nameUrl
	});
}