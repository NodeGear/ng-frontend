var mongoose = require('mongoose')
	, models = require('ng-models')
	, config = require('../../config')
	, util = require('../../util')
	, billing = require('./billing')
	, async = require('async')
	, app = require('../../app')
	, validator = require('validator')

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

	app.get('/profile/profile', util.authorizedPassEmail, getProfile)
}

exports.router = function (app, template) {
	app.put('/profile/profile', updateProfile)
		.get('/profile', getProfile)
		.get('/profile/security', getSecurity)
		.delete('/profile/security/:session_id', destroySession)
	
	billing.router(app)
}

function getProfile (req, res) {
	res.send({
		status: 200,
		user: {
			_id: req.user._id,
			name: req.user.name,
			username: req.user.username,
			email: req.user.email,
			admin: req.user.admin
		}
	})
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

		if (keys.length == 0) {
			return res.send({
				sessions: []
			})
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

					cb(null, session);
				} catch (e) {
					cb(null);
				}
			}, function (err, sessions) {
				if (currentSessionIndex != -1 && currentSessionIndex < sessions.length) {
					sessions[currentSessionIndex].currentSession = true;
				}

				for (var i = 0; i < sessions.length; i++) {
					sessions[i]._id = dbSessions[i]._id;
				}

				async.reject(sessions, function (session, cb) {
					cb(typeof session == 'undefined' || !session)
				}, function (sessions) {
					res.send({
						status: 200,
						sessions: sessions
					})
				})
			})
		})
	})
}

function destroySession (req, res) {
	try {
		var session_id = mongoose.Types.ObjectId(req.params.session_id);
	} catch (e) {
		return res.send(400);
	}

	models.UserSession.findOne({
		_id: session_id,
		user: req.user._id
	}, function (err, session) {
		if (err) throw err;

		if (!session) {
			return res.send({ status: 404, message: "Not Found" });
		}
		res.send({
			status: 200,
			message: "Session Deleted."
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
		})
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
				if (username === req.user.usernameLowercase) {
					return cb(null);
				}

				if (!username.match(/^[a-zA-Z0-9_-]{3,15}$/)) {
					// Errornous username
					return cb(null, "Username Invalid");
				}

				models.User.find({
					usernameLowercase: username
				}).select('_id').exec(function(err, users) {
					if (err) return cb(err);

					if (users.length == 0) {
						// Username free
						req.user.username = user.username;
						req.user.usernameLowercase = user.username.toLowerCase();

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
			
			if (email.length > 0 && validator.isEmail(email)) {
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

		async.parallel([
			function (done) {
				if (user.password && user.newPassword && user.password.length > 0 && user.newPassword.length > 0) {
					req.user.comparePassword(user.password, function (same) {
						if (!same) {
							ers.push("Current Password Invalid");
							done();
						} else {
							if (user.newPassword.length > 6) {
								models.User.hashPassword(user.newPassword, function (hash) {
									req.user.password = hash;
									done();
								});
							} else {
								ers.push("New Password must be over 6 characters.");
								done();
							}
						}
					});
				} else {
					done();
				}
			}
		], function () {
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
		});
	});
}