var mongoose = require('mongoose')
	, ObjectId = mongoose.Schema.ObjectId
	, config = require('../config')

var connection = mongoose.createConnection(config.networkDb, config.networkDb_options);

var schema = mongoose.Schema({
	lag: Number,
	responseTime: Number,
	responseLength: Number,
	responseStatus: Number,
	responseMethod: String,
	requestPath: String,
	user: {
		type: ObjectId
	},
	requestTime: Date,
	unix_seconds: Number
});

module.exports = connection.model("RawData", schema);