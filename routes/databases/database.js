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

}

function deleteDatabase (req, res) {
	res.locals.database.deleted = true;
	res.locals.database.save();

	res.send({
		status: 200
	})
}
