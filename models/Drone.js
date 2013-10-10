var mongoose = require('mongoose')
	, schema = mongoose.Schema
	, ObjectId = schema.ObjectId

var droneSchema = schema({
	name: String,
	pkg: {},
	user: {
		type: ObjectId,
		ref: "User"
	},
	location: String,
	isRunning: Boolean,
	isInstalled: { type: Boolean, default: false }
})

droneSchema.statics.handleTar = function (files) {
	
}

module.exports = mongoose.model("Drone", droneSchema);