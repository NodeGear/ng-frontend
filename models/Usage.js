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
	
	var now = new Date()
	var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()-1, 0, 0, 0);
	var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
	
	module.exports.find({
		drone: droneID,
		time: {
			$gt: start,
			$lte: end
		}
	}).sort('-time').exec(function(err, usage) {
		if (err) throw err;
		
		cb(usage);
	})
}

module.exports = mongoose.model("Usage", usageSchema);