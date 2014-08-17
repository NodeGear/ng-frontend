var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, app = require('../../app')
	, crypto = require('crypto')
	, bugsnag = require('bugsnag')
	, request = require('request')

	, mongodb = require('mongodb')
	, admin_mysql = require('./databases').admin_mysql
	, databases = require('./databases')

exports.httpRouter = function(app) {
	app.get('/database/:database_id/sso', getDatabase, redirectSSO)
}

exports.unauthorized = function (template) {
	template([
		'database/database',
	])
}

exports.router = function (app) {
	app.all('/database/:database_id', getDatabase)
		.all('/database/:database_id/*', getDatabase)
		.get('/database/:database_id', viewDatabase)
		.put('/database/:database_id', saveDatabase)

		.delete('/database/:database_id', deleteDatabase)
}

function getDatabase (req, res, next) {
	var self = this;
	var id = req.params.database_id;
	
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

	models.Database.findOne(query, function(err, database) {
		if (err || database == null) {
			res.send(404);
			return;
		}
		
		res.locals.database = database;
		
		next();
	});
}

function viewDatabase (req, res) {
	res.send({
		status: 200,
		database: res.locals.database
	})
}

function saveDatabase (req, res) {
	if (req.body.database && req.body.database.name && req.body.database.name.length > 0) {
		res.locals.database.name = req.body.database.name;
		res.locals.database.save();

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

function redirectSSO (req, res) {
	if (res.locals.database.database_type != 'mongolab') {
		return res.redirect('back');
	}

	databases.getMongoLabCustomer(req, res, function (err, user) {
		var timestamp = Math.round(Date.now() / 1000);

		var shasum = crypto.createHash('sha1');
		shasum.update(user.name + ":" + databases.mongolabSSOSalt + ':' + timestamp);
		
		var token = shasum.digest('hex');

		console.log('https://mongolab.com/login/partners/nodegear/accounts/'+user.name+'?timestamp='+timestamp+'&token='+token);
		res.redirect('https://mongolab.com/login/partners/nodegear/accounts/'+user.name+'?timestamp='+timestamp+'&token='+token);
	});
}

function deleteDatabase (req, res) {
	var db = res.locals.database;

	db.deleted = true;
	db.save();

	// Delete the remote counterpart
	if (db.database_type == 'mongolab') {
		databases.getMongoLabCustomer(req, res, function (err, user) {
			request({
				url: databases.mongolabEndpoint+'accounts/'+user.name+'/databases/'+db.db_name,
				method: "DELETE",
				json: true
			}, function (err, response, body) {
				if (response.statusCode != 200) {
					console.log(err, body);
					
					bugsnag.notify(new Error("MongoLab Database Delete Failed"), {
						severity: 'error',
						context: body,
						userId: req.user._id
					});
				}
			});
		});
	}
	if (db.database_type == 'mysql') {
		admin_mysql.query('REVOKE ALL PRIVILEGES ON `'+db._id.toString()+'`.* FROM \''+db.db_user+'\'@\'%\';', function(err) {
			if (err) {
				return bugsnag.notify(err, {
					context: 'user tried to delete mysql database',
					userId: req.user._id
				});
			}

			admin_mysql.query('DROP DATABASE '+db._id.toString()+';', function(err) {
				if (err) {
					return bugsnag.notify(err, {
						context: 'user tried to delete mysql database (query failed)',
						userId: req.user._id
					});
				}
			});
		});
	}
	if (db.database_type == 'mongodb') {
		var db = new mongodb.Db('admin', new mongodb.Server(config.credentials.admin_mongodb.host, 27017), {
			safe: false
		});

		db.open(function(err, db) {
			db.authenticate(config.credentials.admin_mongodb.user, config.credentials.admin_mongodb.pass, function(err, result) {
				if (err) {
					return bugsnag.notify(err, {
						context: 'user tried to delete mongodb database',
						userId: req.user._id
					});
				}

				var newdb = db.db(res.locals.database._id.toString());
				newdb.removeUser(req.user._id.toString(), function(err) {
					if (err) {
						return bugsnag.notify(err, {
							context: 'user tried to delete mongodb database (delete user)',
							userId: req.user._id
						});
					}

					newdb.dropDatabase(function(err) {
						if (err) {
							return bugsnag.notify(err, {
								context: 'user tried to delete mongodb database (drop db)',
								userId: req.user._id
							});
						}

						newdb.close();
						db.close();
					});
				});
			});
		});
	}

	res.send({
		status: 200
	});
}
