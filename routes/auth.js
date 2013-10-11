var passport = require('passport')
	, models = require('../models')
	, Validator = require('validator').Validator
	, buildFlash = require('../util').buildFlash

exports.router = function (app) {
	app.post('/auth/password', doLogin)
		.post('/auth/register', doRegister)
		
		.get('/logout', doLogout)
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
	v.check(req.body.password, 'Please enter a valid password').len(5)
	
	if (errs.length == 0) {
		models.User.findOne({ email: req.body.email }, function(err, user) {
			if (err) {
				return cb(err);
			}
		
			// TODO hash
			if (!user || user.password != req.body.password) {
				errs.push("Incorrect credentials")
			}
			
			if (errs.length > 0) {
				var err = buildFlash(errs, { title: "Login Failed..", class: "danger" });
				req.session.flash = [err];
				res.redirect('/')
				return;
			}
			
			req.login(user, function(err) {
				if (err) throw err;
				
				req.session.flash.push(buildFlash(["Thank you for logging in with NodeCloud"], { title: "Success", class: "info" }));
				res.redirect('/apps');
			})
		})
	} else {
		var err = buildFlash(errs, { title: "Login Failed..", class: "danger" });
		req.session.flash = [err];
		res.redirect('/')
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
		// Check duplicate emails in db
		models.User.takenEmail(req.body.email, function(taken) {
			if (taken) {
				errs.push("Email is already taken. Forgotten your password?[link]");
				
				var err = buildFlash(errs, { title: "Registration Failed..", class: "danger" });
				
				req.session.flash = [err];
				res.redirect('/');
			} else {
				// Register
				var user = new models.User({
					email: req.body.email,
					password: req.body.password,
					name: req.body.name
				})
				user.save()
				
				// log in now
				req.login(user, function(err) {
					if (err) throw err;
					
					req.session.flash.push(buildFlash(["Thank you for Registering with NodeCloud"], { title: "Registration Success!", class: "info" }));
					res.redirect('/apps');
				})
			}
		})
	} else {
		var err = buildFlash(errs, { title: "Registration Failed..", class: "danger" });
		
		req.session.flash = [err];
		res.redirect('/');
	}
}

function doLogout (req, res) {
	req.logout();
	res.redirect('/')
}