var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, server = require('../../app')
	, async = require('async')

	, mongodb = require('mongodb')
	, admin_mysql = require('mysql').createConnection(config.credentials.admin_mysql)

exports.admin_mysql = admin_mysql;

var database = require('./database');

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

function addDatabase (req, res) {
	var db = req.body.database;
	
	var errs = [];
	
	if (typeof db === 'undefined' || !db || !db.name || db.name.length == 0) {
		errs.push("Name Invalid");
	}
	if (typeof db === 'undefined' || !db || !db.database_type || db.database_type.length == 0 || !(db.database_type == 'mysql' || db.database_type == 'mongodb')) {
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

	database.createPassword(function(db_pass) {
		// Create the database
		if (database.database_type == 'mongodb') {
			// Create mongodb db
			var db = new mongodb.Db('admin', new mongodb.Server(config.credentials.admin_mongodb.host, '27017'));
			db.open(function(err, db) {
				db.authenticate(config.credentials.admin_mongodb.user, config.credentials.admin_mongodb.pass, function(err, result) {
					if (err) throw err;

					var newdb = db.db(database._id.toString());
					newdb.addUser(req.user._id.toString(), db_pass, function(err, result) {
						if (err) throw err;

						newdb.collection('system.users').update({
							user: req.user._id.toString()
						}, {
							$set: {
								roles: ['readWrite']
							}
						}, function(err) {
							if (err) throw err;

							newdb.close();
							db.close();
							
							complete(err, {
								db_host: config.credentials.admin_mongodb.host,
								db_user: req.user._id.toString(),
								db_name: database._id,
								db_port: 27017
							});
						})
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
				if (err) throw err;

				query = "GRANT ALL ON `"+database._id+"`.* to '"+uid+"'@'%' identified by '"+db_pass+"';";

				admin_mysql.query(query, function(err) {
					if (err) throw err;

					complete(err, {
						db_host: config.credentials.admin_mysql.host,
						db_user: uid,
						db_name: database._id,
						db_port: 3306
					});
				});
			});
		}
	})
}