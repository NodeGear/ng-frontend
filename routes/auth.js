var passport = require('passport')
	, models = require('../models')
	, Validator = require('validator').Validator
	, buildFlash = require('../util').buildFlash
	, util = require('../util')
	, exec = require('child_process').exec
	, config = require('../config')
	, speakeasy = require('speakeasy')

exports.router = function (app) {
	app.post('/auth/password', doLogin)
		.post('/auth/register', doRegister)
		.put('/auth/tfa', util.authorized, getTFA, enableTFA)
		.delete('/auth/tfa', util.authorized, getTFA, disableTFA)
		.get('/auth/tfa', util.authorized, getTFA, checkTFAEnabled)
		.post('/auth/tfa', util.authorizedPassTFA, getTFA, checkTFA)
		
		.get('/logout', doLogout)

		.get('/auth/loggedin', isLoggedIn)
		.get('/auth/page/login', getLoginPage)
		.get('/auth/page/forgot', getForgotPage)
		.get('/auth/page/register', getRegisterPage)
		.get('/auth/page/tfa', getTFAPage)
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

function doLogin (req, res) {
	var v = new Validator()
	var errs = [];
	v.error = function (err) {
		errs.push(err)
	}
	
	// validate email
	v.check(req.body.email, 'Please enter a valid email address').isEmail();
	
	// validate password
	v.check(req.body.password, 'Please enter a valid password').len(4)
	
	if (errs.length == 0) {
		var email = req.body.email.toLowerCase();
		models.User.findOne({ email: email }, function(err, user) {
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
							tfa: user.tfa_enabled
						})
					},
					html: function() {
						res.redirect('/apps');
					}
				});
			})
		})
	} else {
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
	}
}

function doRegister (req, res) {
	//TODO let people register..
	res.send(404);
	return;

	var v = new Validator()
	var errs = [];
	v.error = function (err) {
		errs.push(err)
	}
	
	// validate email
	v.check(req.body.email, 'Please enter a valid email address').isEmail();
	
	// validate password
	v.check(req.body.password, 'Please enter a valid password').len(5)
	
	if (errs.length == 0) {
		var email = req.body.email.toLowerCase();
		
		// Check duplicate emails in db
		models.User.takenEmail(email, function(taken) {
			if (taken) {
				errs.push("Email is already taken. Forgotten your password?[link]");
				
				var err = buildFlash(errs, { title: "Registration Failed..", class: "danger" });
				
				req.session.flash = [err];
				res.redirect('/');
			} else {
				// Register
				var user = new models.User({
					email: email,
					name: req.body.name
				})
				user.setPassword(req.body.password);
				user.save()
				
				// log in now
				req.login(user, function(err) {
					if (err) throw err;
					
					req.session.flash.push(buildFlash(["Thank you for Registering with NodeGear"], { title: "Registration Success!", class: "info" }));
					res.redirect('/apps');
				})
				
				var script = config.path+"/scripts/createUser.sh "+config.droneLocation+" "+user._id;
				console.log(script);
				var run = exec(script)
				run.stdout.on('data', function(data) {
					console.log(data)
				})
				run.stderr.on('data', function(data) {
					console.log(data)
				})
				
				run.on('close', function(code) {
					// Get the ID and GID
					
					uid = exec("id -u "+user._id)
					uid.stdout.on("data", function(data) {
						console.log("UID: "+parseInt(data));
						user.uid = parseInt(data);
					})
					uid.on('close', function() {
						gid = exec("id -g "+user._id)
						gid.stdout.on("data", function(data) {
							console.log("GID: "+parseInt(data));
							user.gid = parseInt(data);
							user.save()
						})
					})
				})
			}
		})
	} else {
		var err = buildFlash(errs, { title: "Registration Failed..", class: "danger" });
		
		req.session.flash = [err];
		res.redirect('/');
	}
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