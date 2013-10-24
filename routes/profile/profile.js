var mongoose = require('mongoose')
	, models = require('../../models')
	, config = require('../../config')
	, util = require('../../util')
	, sshkeys = require('./sshkeys')

exports.router = function (app) {
	app.get('/profile', util.authorized, viewProfile)
	app.get('/profile/profile', util.authorized, getProfile);
	
	sshkeys.router(app)
}

function viewProfile (req, res) {
	res.render('profile/profile')
}

function getProfile (req, res) {
	res.render('profile/profileView')
}