var mongoose = require('mongoose')
	, schema = mongoose.Schema
	, ObjectId = schema.ObjectId
	
var analyticsSchema = schema({
	start: Date,
	end: Date,
	drone: { type: ObjectId, ref: 'Drone' },
	hostname: String,
	found: { type: Boolean, default: false },
	request: String,
	url: String,
	statusCode: Number,
	reqSize: { type: Number, default: 0 }, // of bytes
	resSize: { type: Number, default: 0 },
	ip: String
})

analyticsSchema.statics.getAnalyticsForDrone = function(drone, limit, sort, cb) {
	if (typeof limit === 'function') {
		cb = limit;
		limit = 100;
	}
	if (typeof limit === 'undefined') {
		limit = 100;
	}
	if (typeof sort === 'function') {
		cb = sort;
		sort = '-end'
	}
	if (typeof sort === 'undefined') {
		sort = '-end'
	}
	if (typeof cb !== 'function') {
		return;
	}
	
	module.exports.find({
		drone: drone._id
	}).sort(sort).limit(limit).exec(function(err, analytics) {
		if (err) throw err;
		
		cb(analytics)
	})
}

module.exports = mongoose.model("Analytic", analyticsSchema);