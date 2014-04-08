var mongoose = require('mongoose')
	, models = require('../../models')
	, config = require('../../config')
	, util = require('../../util')
	, sshkeys = require('./sshkeys')
	, billing = require('./billing')
	, async = require('async')

exports.router = function (app) {
	app.get('/profile', util.authorized, viewProfile)
		.get('/profile/profile', util.authorizedPassEmail, getProfile)
		.put('/profile/profile', util.authorized, updateProfile)
	
	sshkeys.router(app)
	billing.router(app)
}

function viewProfile (req, res) {
	res.render('profile/profile')
}

function getProfile (req, res) {
	if (req.query.partial)
		return res.render('profile/profileView')

	var u = req.user.toObject();
	res.send({
		status: 200,
		user: {
			name: u.name,
			username: u.username,
			email: u.email
		}
	})
}

function updateProfile (req, res) {
	var user = req.body.user;

	if (!user) {
		res.send(400)
		return;
	}

	async.parallel([
		function(cb) {
			var username = user.username.toLowerCase();
			if (username.length > 0) {
				if (username === req.user.username) {
					return cb(null);
				}

				models.User.find({
					username: username,
					disabled: false
				}).select('_id').exec(function(err, users) {
					if (err) return cb(err);

					if (users.length == 0) {
						// Username free
						req.user.username = user.username;

						cb(null);
					} else {
						cb(null, "Username Taken")
					}
				})
			} else {
				cb(null, "Username Invalid");
			}
		},
		function(cb) {
			var email = user.email.toLowerCase();
			var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

			if (email.length > 0 && emailRegex.test(email)) {
				if (email === req.user.email) {
					return cb(null);
				}

				models.User.find({
					email: email,
					disabled: false
				}).select('_id').exec(function(err, users) {
					if (err) return cb(err);
					
					if (users.length == 0) {
						// Email free
						req.user.email = email;
						cb(null);
					} else {
						cb(null, "Email Taken")
					}
				})
			} else {
				cb(null, "Email Invalid");
			}
		}
	], function(err, errs) {
		if (err) throw err;

		var ers = [];
		for (var e = 0; e < errs.length; e++) {
			if (!(typeof errs[e] === 'undefined' || !errs[e])) {
				ers.push(errs[e]);
			}
		};

		if (user.name.length > 0) {
			if (user.name !== req.user.name) {
				req.user.name = user.name;
			}
		} else {
			ers.push("Name Invalid")
		}

		if (user.password && user.newPassword && user.password.length > 0 && user.newPassword.length > 0) {
			if (models.User.getHash(user.password) != req.user.password) {
				ers.push("Current Password Invalid");
			} else {
				if (user.newPassword.length > 6) {
					req.user.setPassword(user.newPassword);
				} else {
					ers.push("New Password must be over 6 characters.");
				}
			}
		}

		if (ers.length > 0) {
			res.send({
				status: 400,
				message: "Cannot save profile: " + ers.join(", "),
				errs: ers
			})
		} else {
			req.user.save();

			res.send({
				status: 200
			})
		}
	})
}