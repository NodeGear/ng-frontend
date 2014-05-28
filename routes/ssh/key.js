var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, app = require('../../app')

exports.httpRouter = function(app) {
}

exports.unauthorized = function (template) {
	template([
		'ssh/key',
	])
}

exports.router = function (app) {
	app.all('/ssh/:key_id', get)
		.all('/ssh/:key_id/*', get)
		.get('/ssh/:key_id', view)
		.put('/ssh/:key_id', save)

		.delete('/ssh/:key_id', _delete)
}

function get (req, res, next) {
	var self = this;
	var id = req.params.key_id;
	
	var query = {
		user: req.user._id,
		deleted: false
	};

	try {
		query._id = mongoose.Types.ObjectId(id);
	} catch (e) {
		res.send(404, {});
		return;
	}

	models.RSAKey.findOne(query).select('_id name public_key installed installing').exec(function(err, key) {
		if (err || key == null) {
			res.send(404);
			return;
		}
		
		res.locals.key = key;
		
		next();
	});
}

function view (req, res) {
	var k = res.locals.key.toObject();
	
	res.send({
		status: 200,
		key: k
	})
}

function save (req, res) {
	var k = req.body.key;
	var key = res.locals.key;

	if (k && k.name && k.name.length > 0) {
		key.name = k.name;
		if (!key.installed) {
			// Update pub key
			key.public_key = k.public_key;
		}

		key.save(function (err) {
			if (err) throw err;

			if (!key.installed) {
				// Install teh key
				app.backend.publish("git", JSON.stringify({
					action: "installRSAKey",
					key_id: key._id.toString()
				}));
			}
		});

		res.send({
			status: 200
		});
	} else {
		res.send({
			status: 400,
			message: "Invalid Name"
		});
	}
}

function _delete (req, res) {
	var key = res.locals.key;

	app.backend.publish("git", JSON.stringify({
		action: "deleteRSAKey",
		key_id: key._id.toString()
	}));

	res.send({
		status: 200
	})
}
