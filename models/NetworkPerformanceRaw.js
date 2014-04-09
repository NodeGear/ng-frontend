var mongoose = require('mongoose')
	, ObjectId = mongoose.Schema.ObjectId
	, crypto = require('crypto')
	
var schema = mongoose.Schema({
	lag: Number,
	responseTime: Number,
	responseLength: Number,
	responseStatus: Number,
	responseMethod: String,
	date: Date,
	seconds: Number
});

module.exports = mongoose.model("NetworkPerformanceRaw", schema);