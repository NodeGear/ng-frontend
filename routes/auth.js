var passport = require('passport')
	, models = require('../models')
	, Validator = require('validator').Validator

exports.router = function (app) {
	app.post('/auth/password', passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/'
	}))
		.post('/auth/register', doRegister)
		
		.get('/logout', doLogout)
}

function doRegister (req, res) {
	var v = new Validator()
	var errs = [];
	v.error = function (err) {
		errs.push(err)
	}
	
	// validate password
	v.check(req.body.password).min(5)
	
	// validate email
	v.check(req.body.email).isEmail();
	
	if (errs.length == 0) {
		// Check duplicate emails in db
		models.User.takenEmail(req.body.email, function(taken) {
			if (taken) {
				errs.push("Email is already taken");
				req.session.flash = errs;
				res.redirect('/');
			} else {
				// Register
				new models.User({
					email: req.body.email,
					password: req.body.password,
					name: req.body.name
				}).save()
				res.redirect('/')
			}
		})
	} else {
		req.session.flash = errs;
		res.redirect('/');
	}
}

function doLogout (req, res) {
	req.logout();
	res.redirect('/')
}