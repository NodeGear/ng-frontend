var mongoose = require('mongoose')
	, schema = mongoose.Schema
	, ObjectId = schema.ObjectId
	
var usageSchema = schema({
	time: Date,
	drone: { type: ObjectId, ref: 'Drone' },
	memory: Number, // bytes
	cpu: Number
})

usageSchema.statics.getUsageForDrone = function (droneID, limit, cb) {
	if (typeof limit === "function") {
		cb = limit;
		limit = 20;
	} else if (typeof cb !== "function") {
		return;
	}
	
	module.exports.find({
		drone: droneID
	}).sort('-time').limit(limit).exec(function(err, usage) {
		if (err) throw err;
		
		cb(usage);
	})
}

module.exports = mongoose.model("Usage", usageSchema);