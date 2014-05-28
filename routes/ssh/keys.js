var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, server = require('../../app')
	, async = require('async')
	, router_key = require('./key');

exports.httpRouter = function(app) {
	router_key.httpRouter(app);
}

exports.unauthorized = function (app, template) {
	// Unrestricted -- non-authorized people can access!
	template([
		'ssh/key',
		'ssh/keys'
	]);

	router_key.unauthorized(template);
}

exports.router = function (app) {
	app
		.post('/ssh/key', addKey)
		.get('/ssh/keys', getKeys)
		.put('/ssh/system', getSystemKey)
	
	router_key.router(app)
}

function getKeys (req, res) {
	var self = this;
	
	models.RSAKey.find({
		user: req.user._id,
		deleted: false
	}).select('_id name public_key installed installing').sort('-installed').exec(function(err, keys) {
		if (err) throw err;

		res.send({
			keys: keys
		});
	});
}

function getSystemKey (req, res) {
	models.RSAKey.findOne({
		user: req.user._id,
		deleted: false,
		system_key: true
	}).exec(function(err, keys) {
		if (err) throw err;

		if (!system_key) {
			// Generate one..
			res.send({
				status: 200,
				message: "Creating Key"
			});
		
			system_key = new models.RSAKey({
				name: "System Key",
				nameLowercase: "System Key",
				user: req.user._id,
				system_key: true
			});
		
			system_key.save(function(err) {
				if (err) throw err;

				server.backend.publish("git", JSON.stringify({
					action: "createRSAKey",
					key_id: system_key._id.toString()
				}));
			})
		} else {
			res.send({
				status: 400,
				message: "System Key already exists",
				key_id: system_key._id
			});
		}
	});
}

function addKey (req, res) {
	var key = req.body.key;
	
	var errs = [];
	
	if (typeof key === 'undefined' || !key || !key.name || key.name.length == 0) {
		errs.push("Name Invalid");
	}
	if (typeof key === 'undefined' || !key || !key.public_key || key.public_key.length == 0) {
		errs.push("Public Key is Invalid");
	}
	
	if (errs.length) {
		res.send({
			status: 400,
			message: errs.join(', '),
			errs: errs
		});
		
		return;
	}
	
	var rsa_key = new models.RSAKey({
		name: key.name,
		nameLowercase: key.name,
		user: req.user._id,
		public_key: key.public_key,
		installed: false
	});

	rsa_key.save(function(err) {
		if (err) throw err;

		server.backend.publish("git", JSON.stringify({
			action: "installRSAKey",
			key_id: rsa_key._id.toString()
		}));
	});

	res.send({
		status: 200,
		message: "Waiting to install..",
		key_id: rsa_key._id
	});
}