var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, app = require('../../app')

	, mongodb = require('mongodb')
	, admin_mysql = require('./databases').admin_mysql

exports.httpRouter = function(app) {
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

function deleteDatabase (req, res) {
	var db = res.locals.database;

	db.deleted = true;
	db.save();

	// Delete the remote counterpart
	if (db.database_type == 'mysql') {
		admin_mysql.query('REVOKE ALL PRIVILEGES ON `'+db._id.toString()+'`.* FROM \''+db.db_user+'\'@\'%\';', function(err) {
			if (err) throw err;

			admin_mysql.query('DROP DATABASE '+db._id.toString()+';', function(err) {
				if (err) throw err;
				console.log("database deleted");
			});
		});
	}
	if (db.database_type == 'mongodb') {
		var db = new mongodb.Db('admin', new mongodb.Server(config.credentials.admin_mongodb.host, 27017), {
			safe: false
		});

		db.open(function(err, db) {
			db.authenticate(config.credentials.admin_mongodb.user, config.credentials.admin_mongodb.pass, function(err, result) {
				if (err) throw err;

				var newdb = db.db(res.locals.database._id.toString());
				newdb.removeUser(req.user._id.toString(), function(err) {
					if (err) throw err;

					newdb.dropDatabase(function(err) {
						if (err) throw err;

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
