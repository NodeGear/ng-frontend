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
		.put('/auth/tfa', util.authorized, enableTFA)
		.delete('/auth/tfa', util.authorized, disableTFA)
		.get('/auth/tfa', util.authorized, checkTFAEnabled)
		.post('/auth/tfa', util.authorizedPassTFA, checkTFA)
		
		.get('/logout', doLogout)
}

function doLogin (req, res) {
	var v = new Validator()
	var errs = [];
	v.error = function (err) {
		errs.push(err)
	}
	
	console.log(req.body)
	
	// validate email
	v.check(req.body.email, 'Please enter a valid email address').isEmail();
	
	// validate password
	v.check(req.body.password, 'Please enter a valid password').len(4)
	
	if (errs.length == 0) {
		var email = req.body.email.toLowerCase();
		models.User.findOne({ email: email }, function(err, user) {
			if (err) {
				return cb(err);
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
							tfa: (user.tfa.enabled && user.tfa.confirmed)
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

function enableTFA (req, res) {
	var key = speakeasy.generate_key({
		length: 20,
		google_auth_qr: true,
		name: "NodeGear"
	});
	
	req.user.tfa.enabled = true;
	req.user.tfa.confirmed = false;
	req.user.tfa.key = key.base32;
	req.user.save();
	
	res.send({
		status: 200,
		qr: key.google_auth_qr,
	})
}

function checkTFAEnabled (req, res) {
	var data = {
		status: 200,
		enabled: req.user.tfa.enabled,
		confirmed: req.user.tfa.confirmed
	};
	
	if (data.enabled && !data.confirmed) {
		data.qr = qr = "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=otpauth://totp/NodeGear%3Fsecret="+req.user.tfa.key;
	}
	
	res.send(data)
}

function disableTFA (req, res) {
	req.user.tfa.enabled = false;
	req.user.tfa.confirmed = false;
	req.user.tfa.key = "";
	req.user.save();
	
	res.send({
		status: 200
	})
}

function checkTFA (req, res) {
	var token = speakeasy.time({
		key: req.user.tfa.key,
		encoding: 'base32'
	});
	
	console.log(token);
	console.log(req.user)
	
	res.send({
		token: token
	});
}

function checkTFA (req, res) {
	var token = speakeasy.totp({
		key: req.user.tfa.key,
		encoding: 'base32'
	})
	
	if (token == req.body.token) {
		if (!req.user.tfa.confirmed) {
			req.user.tfa.confirmed = true;
			req.user.save()
		}
		
		req.session.confirmedTFA = true;
		
		res.send({
			status: 200
		})
	} else {
		req.session.confirmedTFA = false;
		
		res.send({
			status: 404,
			message: "Auth failed: Incorrect Token"
		})
	}
}

function doLogout (req, res) {
	req.logout();
	req.session.destroy();
	res.redirect('/')
}