var mongoose = require('mongoose')
	, models = require('ng-models')
	, config = require('../../config')
	, util = require('../../util')
	, exec = require('child_process').exec
	, fs = require('fs')

exports.router = function (app) {
	app.post('/profile/ssh', util.authorized, postKey)
}

function postKey (req, res) {
	var key = req.body.key;
	
	if (!key) {
		key = "";
	}
	
	req.user.getPublicKey(function(pubKey) {
		if (pubKey == null) {
			pubKey = new models.PublicKey({
				user: req.user._id,
				created: Date.now()
			})
		}
		
		var lines = key.split("\n")
		if (lines.length !== 1) {
			req.session.flash = [util.buildFlash(["Must not contain newlines"], { class: "danger", title: "Invalid SSH Key!" })];
			res.redirect('/profile/ssh')
			return;
		}
		
		pubKey.key = key
		pubKey.updateFile(function(err) {
			if (err) {
				req.session.flash = [util.buildFlash(err, { class: "danger", title: "Invalid SSH Key!" })];
			} else {
				pubKey.save()
			}
		
			res.redirect('/profile/ssh')
		})
	})
}