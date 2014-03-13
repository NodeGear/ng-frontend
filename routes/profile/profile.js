var mongoose = require('mongoose')
	, models = require('../../models')
	, config = require('../../config')
	, util = require('../../util')
	, sshkeys = require('./sshkeys')
	, billing = require('./billing')

exports.router = function (app) {
	app.get('/profile', util.authorized, viewProfile)
		.get('/profile/profile', util.authorized, getProfile)
	
	sshkeys.router(app)
	billing.router(app)
}

function viewProfile (req, res) {
	res.render('profile/profile')
}

function getProfile (req, res) {
	res.render('profile/profileView')
}