'use strict';

var mongoose = require('mongoose'),
 	models = require('ng-models'),
 	config = require('../../config'),
 	util = require('../../util'),
 	billing = require('./billing'),
 	async = require('async'),
 	app = require('../../app'),
 	validator = require('validator'),
 	bugsnag = require('bugsnag');

exports.unauthorized = function (app, template) {
	// Unrestricted -- non-authorized people can access!
	template([
		{
			route: 'profile',
			view: 'profile/profile'
		}, {
			route: 'profile/settings',
			view: 'profile/profileView'
		}, {
			route: 'profile/security',
			view: 'profile/security'
		}
	]);

	billing.unauthorized(template);

	app.get('/profile/profile', util.authorizedPassEmail, getProfile);
};

exports.router = function (app, template) {
	app.put('/profile/profile', updateProfile)
		.get('/profile', getProfile)
		.get('/profile/security', getSecurity)
		.post('/profile/newsletter', subscribe)
		.delete('/profile/newsletter', unsubscribe)
		.delete('/profile/security/:session_id', destroySession);
	
	billing.router(app);
};

function getProfile (req, res) {
	res.send({
		status: 200,
		user: {
			_id: req.user._id,
			name: req.user.name,
			username: req.user.username,
			email: req.user.email,
			admin: req.user.admin,
			appLimit: req.user.appLimit,
			newsletter_active: req.user.newsletter_active
		}
	});
}

function getSecurity (req, res) {
	models.UserSession.find({
		user: req.user._id
	}, function (err, dbSessions) {
		var keys = [];
		var currentSessionIndex = -1;
		for (var i = 0; i < dbSessions.length; i++) {
			keys.push('sess:'+dbSessions[i].session);
			if (dbSessions[i].session == req.sessionID) {
				currentSessionIndex = i;
			}
		}

		if (keys.length === 0) {
			return res.send({
				sessions: []
			});
		}

		app.backend.mget(keys, function (err, sessionObjects) {
			if (err) throw err;

			async.map(sessionObjects, function (session, cb) {
				try {
					session = JSON.parse(session);
					if (!req.user._id.equals(session.passport.user)) {
						throw new Error("User not Valid");
					}

					session = {
						lastAccess: session.lastAccess,
						expiry: new Date(session.cookie.expires).getTime(),
						ip: session.ip,
						ips: session.ips,
						currentSession: false
					};
				} catch (e) {
					bugsnag.notify(e);
				} finally {
					if (session) {
						return cb(null, session);
					}
					
					cb();
				}
			}, function (err, sessions) {
				if (currentSessionIndex != -1 &&
					currentSessionIndex < sessions.length) {
					sessions[currentSessionIndex].currentSession = true;
				}

				for (var i = 0; i < sessions.length; i++) {
					sessions[i]._id = dbSessions[i]._id;
				}

				async.reject(sessions, function (session, cb) {
					cb(typeof session == 'undefined' || !session);
				}, function (sessions) {
					res.send({
						status: 200,
						sessions: sessions
					});
				});
			});
		});
	});
}

function destroySession (req, res) {
	var session_id;
	try {
		session_id = mongoose.Types.ObjectId(req.params.session_id);
	} catch (e) {
		return res.status(400).end();
	}

	models.UserSession.findOne({
		_id: session_id,
		user: req.user._id
	}, function (err, session) {
		if (err) throw err;

		if (!session) {
			return res.send({ status: 404, message: 'Not Found' });
		}
		res.send({
			status: 200,
			message: 'Session Deleted.'
		});

		process.nextTick(function () {
			models.UserSession.remove({
				_id: session_id,
				user: req.user._id
			}, function (err) {
				if (err) throw err;
			});
			app.backend.del('sess:'+session.session, function (err) {
				if (err) throw err;
			});
		});
	});
}

function updateProfile (req, res) {
	var user = req.body.user;

	if (!user) {
		res.status(400).end();
		return;
	}

	async.parallel([
		function(cb) {
			var username = user.username.toLowerCase();
			var valid = validator.isLength(username, 3, 15);

			if (username === req.user.usernameLowercase) {
				// No change
				return cb();
			}

			if (!(valid && username.match(/^[a-zA-Z0-9_-]{3,15}$/) &&
				validator.isAscii(username))) {
				// Errornous username
				return cb(null, 'Username Invalid');
			}

			models.User.taken(username, function (taken) {
				if (!taken) {
					req.user.username = user.username;
					req.user.usernameLowercase = user.username.toLowerCase();
					return cb();
				}

				cb(null, 'Username Taken');
			});
		},
		function(cb) {
			var email = user.email.toLowerCase();
			var valid = validator.isEmail(email);

			if (email === req.user.email) {
				return cb();
			}

			if (!valid) {
				return cb(null, 'Email Invalid');
			}

			models.User.takenEmail(email, function(taken) {
				if (!taken) {
					req.user.email = email;
					return cb();
				}

				cb(null, 'Email Invalid');
			});
		}
	], function(err, results) {
		if (err) throw err;

		var errs = [];
		for (var e = 0; e < results.length; e++) {
			if (results[e]) {
				errs.push(results[e]);
			}
		}

		if (user.name.length > 0) {
			if (user.name !== req.user.name) {
				req.user.name = user.name;
			}
		} else {
			errs.push('Name Invalid');
		}

		if (user.password || user.newPassword) {
			if (!(validator.isLength(user.password, 8, 100) &&
				validator.isLength(user.newPassword, 8, 100))) {
				errs.push('Passwords too short');
				return updateProfileFinish(req, res, errs);
			}
			
			req.user.comparePassword(user.password, function (same) {
				if (!same) {
					errs.push("Current Password Invalid");

					return updateProfileFinish(req, res, errs);
				}

				// Set new pwd
				models.User.hashPassword(user.newPassword, function (hash) {
					req.user.password = hash;
					updateProfileFinish(req, res, errs);
				});
			});
		} else {
			updateProfileFinish(req, res, errs);
		}
	});
}

function updateProfileFinish (req, res, errs) {
	if (errs.length > 0) {
		res.status(400).send({
			message: 'Cannot save profile: ' + errs.join(", "),
			errs: errs
		});
	} else {
		req.user.save();
		res.status(200).end();
	}
}

function subscribe (req, res) {
	// Subscribe user to mailchimp
	if (!config.mailchimp) {
		res.status(422).end();
		return;
	}

	var names = req.user.name.split(' ');
	var first_name = '', last_name = '';

	if (names.length > 0) {
		first_name = names[0];
	}
	if (names.length > 1) {
		last_name = names[names.length-1];
	}

	config.mailchimp.lists.subscribe({
		id: 'b6d1210190',
		email: {
			email: req.user.email
		},
		merge_vars: {
			FNAME: first_name,
			LNAME: last_name
		},
		update_existing: true,
		double_optin: false
	}, function (err) {
		if (err.error) {
			bugsnag.notify(err, {
				user: req.user._id
			});
			return res.send(500);
		}

		models.User.update({
			_id: req.user._id
		}, {
			$set: {
				newsletter_active: true
			}
		}, function (e) {});

		res.send(200);
	});
}

function unsubscribe (req, res) {
	// Unsubscribe user from mailchimp
	if (!config.mailchimp) {
		res.send(422);
		return;
	}

	config.mailchimp.lists.unsubscribe({
		id: 'b6d1210190',
		email: {
			email: req.user.email
		},
		delete_member: true,
		send_goodbye: false,
		send_notify: false
	}, function (err) {
		models.User.update({
			_id: req.user._id
		}, {
			$set: {
				newsletter_active: false
			}
		}, function (e) {});

		res.send(200);
	});
}