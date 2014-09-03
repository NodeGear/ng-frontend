var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, server = require('../../app')
	, async = require('async')
	, request = require('request')
	, crypto = require('crypto')
	, bugsnag = require('bugsnag')

	, mongodb = require('mongodb')
	, admin_mysql = require('mysql').createConnection(config.credentials.admin_mysql)

exports.admin_mysql = admin_mysql;

admin_mysql.on('error', function(err) {
	bugsnag.notify(err, {
		context: 'Admin Mysql Spitting Errors'
	});
});

var database = require('./database');

exports.mongolabEndpoint = config.credentials.mongolab_endpoint;
exports.mongolabSSOSalt = config.credentials.mongolab_sso_salt;

exports.httpRouter = function(app) {
	database.httpRouter(app);
}

exports.unauthorized = function (app, template) {
	// Unrestricted -- non-authorized people can access!
	template([
		{
			route: 'databases',
			view: 'database/databases'
		},
		'database/add'
	]);

	database.unauthorized(template);
}

exports.router = function (app) {
	app
		.post('/database', addDatabase)
		.get('/databases', getDatabases)
	
	database.router(app)
}

function getDatabases (req, res) {
	var self = this;
	
	models.Database.find({
		user: req.user._id,
		deleted: false
	}, function(err, databases) {
		if (err) throw err;

		res.send({
			databases: databases
		});
	});
}

exports.getMongoLabCustomer = function (req, res, cb) {
	request({
		url: exports.mongolabEndpoint+'accounts/nodegear_'+req.user._id,
		json: true
	}, function (err, response, body) {
		if (!err && response.statusCode == 200) {
			return cb(null, body);
		}

		// Create an account on mongolab
		request({
			url: exports.mongolabEndpoint+'accounts',
			method: "POST",
			json: {
				name: 'nodegear_'+req.user._id,
				adminUser: {
					email: req.user.email
				}
			}
		}, function (err, response, body) {
			if (response.statusCode == 201 || response.statusCode == 200) {
				cb(null, body);
			} else {
				bugsnag.notify(new Error("MongoLab Account Creation Failed"), {
					severity: 'error',
					context: body,
					userId: req.user._id
				});

				cb('Unknown Error');
			}
		})
	})
}

function addDatabase (req, res) {
	var db = req.body.database;
	
	var errs = [];
	
	if (typeof db === 'undefined' || !db || !db.name || db.name.length == 0) {
		errs.push("Name Invalid");
	}
	if (typeof db === 'undefined' || !db || !db.database_type || db.database_type.length == 0 || !(db.database_type == 'mysql' || db.database_type == 'mongodb' || db.database_type == 'mongolab')) {
		errs.push("Database Type is Invalid");
	}
	
	if (errs.length) {
		res.send({
			status: 400,
			message: errs.join(', '),
			errs: errs
		})
		
		return;
	}
	
	var database = new models.Database({
		name: db.name,
		nameLowercase: db.name,
		user: req.user._id,
		database_type: db.database_type
	});

	var complete = function (err, details) {
		if (err) throw err;

		database.db_host = details.db_host;
		database.db_user = details.db_user;
		database.db_name = details.db_name;
		database.db_port = details.db_port;

		if (database.database_type == 'mongodb') {
			database.url = 'mongodb://'+database.db_user+':'+database.db_pass+'@'+database.db_host+':27017/'+database.db_name;
		}

		database.save(function(err) {
			if (err) { 
				res.send(500, {
				});
				return;
			}

			res.send(200, {
				status: 200,
				database: database.toObject()
			})
		})
	}

	if (database.database_type == 'mongolab') {
		exports.getMongoLabCustomer(req, res, function (err, user) {
			if (err) {
				bugsnag.notify(err, {
					severity: 'error',
					context: 'mongolab get customer',
					userId: req.user._id
				});

				return res.send({
					status: 400,
					message: err
				});
			}

			request({
				url: exports.mongolabEndpoint+'accounts/'+user.name+'/databases',
				method: "POST",
				json: {
					name: user.name+'_'+ database._id,
					plan: 'sandbox',
					username: user.name
				}
			}, function (err, response, body) {
				if (response.statusCode == 200 || response.statusCode == 201) {
					database.db_name = body.name;
					database.url = body.uri;

					complete(null, {
						db_name: body.name
					});
				} else {
					bugsnag.notify(new Error("MongoLab Database Create Failed"), {
						severity: 'error',
						context: body,
						userId: req.user._id
					});
					
					res.send({
						status: 400,
						message: 'Could not create monglab database!'
					});
				}
			});
		});
	} else {
		database.createPassword(function(db_pass) {
			// Create the database
			if (database.database_type == 'mongodb') {
				// Create mongodb db
				var db = new mongodb.Db('admin', new mongodb.Server(config.credentials.admin_mongodb.host, 27017), {
					safe: false
				});

				db.open(function(err, db) {
					db.authenticate(config.credentials.admin_mongodb.user, config.credentials.admin_mongodb.pass, function(err, result) {
						if (err) {
							return bugsnag.notify(err, {
								context: 'user tried to create mongodb database',
								userId: req.user._id
							});
						}

						var newdb = db.db(database._id.toString());
						newdb.addUser(req.user._id.toString(), db_pass, {
							roles: ['readWrite']
						}, function(err, result) {
							if (err) {
								return bugsnag.notify(err, {
									context: 'user tried to create mongodb database (add user)',
									userId: req.user._id
								});
							}

							newdb.close();
							db.close();

							complete(err, {
								db_host: config.credentials.admin_mongodb.ip,
								db_user: req.user._id.toString(),
								db_name: database._id,
								db_port: 27017
							});
						})
					})
				});
			}

			if (database.database_type == 'mysql') {
				// Create mysql db
				var uid = req.user._id.toString();
				uid = uid.substring(uid.length - 15, uid.length);

				var query = "CREATE DATABASE IF NOT EXISTS "+database._id+";";
				
				admin_mysql.query(query, function(err, results) {
					if (err) {
						return bugsnag.notify(err, {
							context: 'user tried to create mysql database',
							userId: req.user._id
						});
					}

					query = "GRANT ALL ON `"+database._id+"`.* to '"+uid+"'@'%' identified by '"+db_pass+"';";

					admin_mysql.query(query, function(err) {
						if (err) {
							return bugsnag.notify(err, {
								context: 'user tried to create mysql database (grants)',
								userId: req.user._id
							});
						}

						complete(err, {
							db_host: config.credentials.admin_mysql.ip,
							db_user: uid,
							db_name: database._id,
							db_port: 3306
						});
					});
				});
			}
		})
	}
}