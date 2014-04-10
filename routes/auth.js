var passport = require('passport')
	, models = require('ng-models')
	, Validator = require('validator').Validator
	, buildFlash = require('../util').buildFlash
	, util = require('../util')
	, exec = require('child_process').exec
	, config = require('../config')
	, speakeasy = require('speakeasy')
	, async = require('async')

exports.router = function (app) {
	app.post('/auth/password', doLogin)
		.post('/auth/register', doRegister)
		.post('/auth/forgot', doForgot)
		.get('/auth/forgot', showForgot)
		.post('/auth/forgot/reset', performReset)
		.put('/auth/tfa', util.authorized, getTFA, enableTFA)
		.delete('/auth/tfa', util.authorized, getTFA, disableTFA)
		.get('/auth/tfa', util.authorized, getTFA, checkTFAEnabled)
		.post('/auth/tfa', util.authorizedPassTFA, getTFA, checkTFA)
		.post('/auth/verifyEmail', function (req, res, next) {
			if (req.user && !req.user.email_verified) {
				next();

				return;
			}

			util.authorized(req, res, next);
		}, doVerifyEmail)

		.get('/logout', doLogout)

		.get('/auth/loggedin', isLoggedIn)
		.get('/auth/page/login', getLoginPage)
		.get('/auth/page/forgot', getForgotPage)
		.get('/auth/page/register', getRegisterPage)
		.get('/auth/page/tfa', getTFAPage)
		.get('/auth/page/verifyEmail', getVerifyEmailPage)
}

function isLoggedIn (req, res) {
	res.send({
		isLoggedIn: res.locals.loggedIn,
		requiresTFA: res.locals.requiresTFA
	});
}

function getLoginPage (req, res) {
	res.render('auth/login');
}

function getForgotPage (req, res) {
	res.render('auth/forgot');
}

function getRegisterPage (req, res) {
	res.render('auth/register');
}

function getTFAPage (req, res) {
	res.render('auth/tfa')
}

function getVerifyEmailPage (req, res) {
	res.render('auth/verifyEmail')
}

function doLogin (req, res) {
	var v = new Validator()
	var errs = [];
	v.error = function (err) {
		errs.push(err)
	}
	
	var isEmail = false;

	try {
		require('validator').check(req.body.auth).isEmail();
		isEmail = true;
	} catch (e) {
		// not an email
	}

	v.check(req.body.auth, 'Please enter a valid Username/Email').len(4);
	
	// validate password
	v.check(req.body.password, 'Please enter a valid password').len(4)
	
	if (errs.length > 0) {
		var err = buildFlash(errs, { title: "Login Failed..", class: "danger" });

		res.format({
			html: function() {
				req.session.flash = [err];
				res.redirect('/')
			},
			json: function() {
				res.send({
					status: 404,
					message: "Incorrect Credentials"
				});
			}
		});

		return;
	}

	var authDetail = req.body.auth.toLowerCase();
	var authMethod = isEmail ? "email" : "usernameLowercase";

	var query = {
		disabled: false
	};
	query[authMethod] = authDetail;

	models.User.findOne(query, function(err, user) {
		if (err) {
			throw err;
		}
		
		if (!user || user.password != models.User.getHash(req.body.password)) {
			errs.push("Incorrect credentials")
		}
		
		if (errs.length > 0) {
			var err = buildFlash(errs, { title: "Login Failed..", class: "danger" });
			
			res.format({
				html: function() {
					req.session.flash = [err];
					res.redirect('/')
				},
				json: function() {
					res.send({
						status: 404,
						message: "Incorrect Credentials"
					});
				}
			});
			
			return;
		}
		
		req.login(user, function(err) {
			if (err) throw err;
			
			res.format({
				json: function() {
					res.send({
						status: 200,
						tfa: user.tfa_enabled,
						email_verification: user.email_verified
					})
				},
				html: function() {
					res.redirect('/apps');
				}
			});
		})
	})

}

function doRegister (req, res) {
	var v = new Validator()
	var errs = [];
	v.error = function (err) {
		errs.push(err)
	}

	if (req.body.user && typeof req.body.user === 'object') {
		var name = req.body.user.name;
		var email = req.body.user.email;
		if (email) {
			email = email.toLowerCase();
		}
		var username = req.body.user.username;
		var password = req.body.user.password;
	}
	
	// validate email
	v.check(email, 'Please enter a valid email address').isEmail();
	v.check(username, 'Please enter a valid username').len(4);
	v.check(name, 'Please enter a valid name').len(4);
	
	// validate password
	v.check(password, 'Please enter a valid password').len(5);

	if (errs.length > 0) {
		var err = buildFlash(errs, { title: "Registration Failed..", class: "danger" });
		
		res.format({
			html: function() {
				req.session.flash = [err];
				res.redirect('/');
			},
			json: function() {
				res.send({
					status: 400,
					errs: errs,
					message: errs.join(', ')
				})
			}
		})
		
		return;
	}

	async.parallel({
		email: function(done) {
			// Check duplicate emails in db
			models.User.takenEmail(email, function(taken) {
				done(null, taken);
			});
		},
		username: function(done) {
			models.User.taken(username, function(taken) {
				done(null, taken);
			})
		}
	}, function(err, results) {
		if (results.email == true || results.username == true) {
			res.send({
				status: 400,
				message: "Registration Failed",
				taken: results
			});

			return;
		}

		// Register
		var user = new models.User({
			email: email,
			username: username,
			usernameLowercase: username.toLowerCase(),
			name: name
		})
		user.setPassword(password);

		var emailVerification = new models.EmailVerification({
			email: email,
			user: user._id
		})

		emailVerification.generateCode(function(code) {
			emailVerification.save();

			user.sendEmail('NodeGear Registrations <registration@nodegear.com>', 'Confirm Your NodeGear Account', 'emails/register.jade', {
				user: user,
				code: code,
				host: req.host
			});
			user.save();
			
			user.createIDs();

			// log in now
			req.login(user, function(err) {
				if (err) throw err;
				
				res.format({
					html: function() {
						req.session.flash.push(buildFlash(["Thank you for Registering with NodeGear"], { title: "Registration Success!", class: "info" }));
						res.redirect('/apps');
					},
					json: function() {
						res.send({
							status: 200
						})
					}
				})
			})

		})
	});
}

function doVerifyEmail (req, res) {
	var code = req.body.code;

	if (!code || code.length > 6) {
		res.send({
			status: 400,
			message: "Invalid Code"
		});
		return;
	}

	models.EmailVerification.findOne({
		user: req.user._id,
		verified: false,
		code: code
	}, function(err, emailVerification) {
		if (err) {
			throw err;
		}

		if (!emailVerification) {
			res.send({
				status: 400,
				message: "Invalid Code"
			});
			return;
		}

		emailVerification.verified = true;
		emailVerification.verifiedDate = Date.now();
		emailVerification.save();
		req.user.email_verified = true;
		req.user.save();

		res.send({
			status: 200,
			message: "Email Verified."
		});
	});
}

function doForgot (req, res) {
	var auth = req.body.auth;
	var code = req.body.code;

	var isEmail = false;

	try {
		require('validator').check(req.body.auth).isEmail();
		isEmail = true;
	} catch (e) {
		// not an email
	}

	if (auth.length <= 4) {
		res.send({
			status: 400,
			message: "Invalid Username/Email Supplied."
		});

		return;
	}

	var authDetail = req.body.auth.toLowerCase();
	var authMethod = isEmail ? "email" : "usernameLowercase";

	var query = {
		disabled: false
	};
	query[authMethod] = authDetail;

	models.User.findOne(query, function(err, user) {
		if (err) {
			throw err;
		}

		res.send({
			status: 200,
			message: ""
		});

		if (!user) {
			return;
		}

		var forgot = new models.ForgotNotification({
			user: user._id,
			email: user.email
		});
		forgot.generateCode(function(code) {
			forgot.save();

			user.sendEmail('NodeGear User Daemon <users@nodegear.com>', 'NodeGear Password Reset', 'emails/forgot.jade', {
				user: user,
				code: code,
				host: req.host
			});
		});
	});
}

function showForgot (req, res) {
	var code = req.query.code;

	if (!code) {
		res.redirect('/');
		return;
	}

	models.ForgotNotification.findOne({
		code: code,
		used: false,
		created: {
			$gte: Date.now() - (60 * 60 * 1000) // now - 1hr in ms
		}
	}, function(err, forgotNotification) {
		if (err) {
			throw err;
		}

		if (!forgotNotification) {
			res.redirect('/');
			return;
		}

		res.render('auth/forgotReset', {
			code: forgotNotification.code
		})
	});
}

function performReset (req, res) {
	var code = req.body.code;

	if (!code) {
		res.redirect('/');
		return;
	}

	models.ForgotNotification.findOne({
		code: code,
		used: false,
		created: {
			$gte: Date.now() - (60 * 60 * 1000) // now - 1hr in ms
		}
	}).populate('user').exec(function(err, forgotNotification) {
		if (err) {
			throw err;
		}

		if (!forgotNotification) {
			res.redirect('/');
			return;
		}

		if (!req.body.password || req.body.password < 4) {
			res.render('auth/forgotReset', {
				code: forgotNotification.code
			});

			return;
		}

		forgotNotification.user.setPassword(req.body.password);
		forgotNotification.user.sendEmail('NodeGear User Daemon <users@nodegear.com>', 'NodeGear Password Reset Complete', 'emails/forgotComplete.jade', {
			user: forgotNotification.user,
			host: req.host
		});

		forgotNotification.user.save();
		forgotNotification.used = true;
		forgotNotification.usedDate = Date.now();
		forgotNotification.save();

		res.redirect('/');
	});
}

function getTFA (req, res, next) {
	if (!req.user.tfa) return next();

	req.user.populate('tfa', function(err) {
		if (err) throw err;

		next();
	});
}

function enableTFA (req, res) {
	var key = speakeasy.generate_key({
		length: 20,
		google_auth_qr: true,
		name: "NodeGear:"+req.user.email
	});
	
	req.user.tfa_enabled = false;

	var tfa = req.user.tfa;
	if (!tfa) {
		tfa = new models.TFA({
			user: req.user._id
		});
		req.user.tfa = tfa._id;
	}
	tfa.confirmed = false;
	tfa.key = key.base32;

	tfa.save();
	req.user.save();

	var data = {
		status: 200,
		qr: key.google_auth_qr,
	};

	if (process.env.NG_TEST) {
		data.token = speakeasy.totp({
			key: tfa.key,
			encoding: 'base32'
		});
	}

	res.send(data)
}

function checkTFAEnabled (req, res) {
	if (!req.user.tfa) {
		res.send({
			status: 404,
			message: "Not Enabled"
		});
		return;
	}

	var data = {
		status: 200,
		full_enabled: req.user.tfa_enabled,
		confirmed: false,
		enabled: false,
		qr: ""
	};

	if (req.user.tfa) {
		data.confirmed = req.user.tfa.confirmed;
		data.enabled = true;
	}
	
	if (data.enabled) {
		data.qr = "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=otpauth://totp/NodeGear:"+req.user.email+"%3Fsecret="+req.user.tfa.key;
	}
	
	res.send(data);
}

function disableTFA (req, res) {
	if (!req.user.tfa_enabled && !(req.user.tfa && !req.user.tfa.confirmed)) {
		res.send({
			status: 400,
			message: "Not Enabled"
		});
		return;
	}

	req.user.tfa_enabled = false;
	
	models.TFA.remove({
		_id: req.user.tfa._id
	}, function(err) {
		if (err) throw err;
	})

	req.user.tfa = null;
	req.user.save();

	req.user.sendEmail("NodeGear Security Guard <security@nodegear.com>", "Two Factor Auth Disabled!", "emails/tfa/removed.jade", {
		user: req.user
	});
	
	res.send({
		status: 200
	})
}

function checkTFA (req, res) {
	if (!req.user.tfa_enabled && !(req.user.tfa && !req.user.tfa.confirmed)) {
		res.send({
			status: 400,
			message: "Not Enabled"
		});

		return;
	}
	if (!req.user.tfa) {
		res.send({
			status: 500,
			message: "Key Not Found"
		});

		return;
	}

	var token = speakeasy.totp({
		key: req.user.tfa.key,
		encoding: 'base32'
	});
	
	if (token == req.body.token) {
		if (!req.user.tfa.confirmed) {
			req.user.tfa.confirmed = true;
			req.user.tfa_enabled = true;
			req.user.tfa.save();
			req.user.save();

			req.user.sendEmail("NodeGear Security Guard <security@nodegear.com>", "Two Factor Auth Is Enabled", "emails/tfa/added.jade", {
				user: req.user
			});
		}
		
		req.session.confirmedTFA = true;
		
		res.send({
			status: 200
		});
	} else {
		req.session.confirmedTFA = false;
		
		res.send({
			status: 404,
			message: "Auth failed: Incorrect Token"
		});
	}
}

function doLogout (req, res) {
	req.logout();
	req.session.destroy();

	res.format({
		json: function() {
			res.send({
				status: 200
			})
		},
		html: function() {
			res.redirect('/')
		}
	})
}