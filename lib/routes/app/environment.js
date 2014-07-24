var mongoose = require('mongoose')
	, models = require('ng-models')
	, config = require('../../config')
	, util = require('../../util')
	, app = require('../../app')

exports.router = function(_app) {
	_app.all('/app/:id/environment/:eid', getEnv)
		.all('/app/:id/environment/:eid/*', getEnv)
		
		.get('/app/:id/environment', getEnvironment)
		.post('/app/:id/environment', saveEnv)
		.get('/app/:id/environment/:eid', viewEnv)
		.put('/app/:id/environment/:eid', saveEnv)
		.delete('/app/:id/environment/:eid', deleteEnv)
}

function getEnvironment (req, res) {
	models.AppEnvironment.find({
		app: res.locals.app._id
	}, function(err, environment) {
		if (err) throw err;

		res.send({
			status: 200,
			environment: environment
		})
	})
}

function getEnv (req, res, next) {
	var eid = req.params.eid;

	try {
		eid = mongoose.Types.ObjectId(eid);
	} catch (e) {
		res.send({
			status: 400,
			message: "Invalid ID"
		});
		return;
	}

	models.AppEnvironment.findOne({
		_id: eid
	}, function(err, env) {
		if (err) throw err;

		if (!env) {
			res.send({
				status: 404,
				message: "Not found"
			});
			return;
		}

		res.locals.env = env;
		next();
	})
}

function saveEnv (req, res) {
	if (!req.body.env) {
		res.send(400, {
			status: 400,
			message: "Invalid Request"
		});

		return;
	}

	var name = req.body.env.name;
	var value = req.body.env.value;

	if (!name || name.length == 0 || name.length >= 100) {
		res.send({
			status: 400,
			message: "Invalid Variable Name."
		});

		return;
	}
	if (!value || value.length == 0 || value.length >= 254) {
		res.send({
			status: 400,
			message: "Invalid Variable Value."
		});

		return;
	}

	var env = res.locals.env;
	if (!env) {
		models.AppEnvironment.count({
			app: res.locals.app._id
		}, function (err, envCount) {
			if (envCount > 50) {
				return res.send({
					status: 400,
					message: "Environment Variable Limit Exceeded"
				});
			}

			saveCallback(new models.AppEnvironment({
				app: res.locals.app._id
			}), req, res);
		});
	} else {
		saveCallback(env, req, res);
	}
}

function saveCallback (env, req, res) {
	
	env.name = name;
	env.value = value;

	env.save();

	res.send({
		status: 200
	});
}

function viewEnv (req, res) {
	res.send({
		status: 200,
		env: res.locals.env
	})
}

function deleteEnv (req, res) {
	var env = res.locals.env;
	
	models.AppEnvironment.remove({
		_id: env._id
	}, function(err) {
		if (err) throw err;

		res.send({
			status: 200,
			message: ""
		});
	})
}