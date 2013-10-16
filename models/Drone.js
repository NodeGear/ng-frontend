var mongoose = require('mongoose')
	, schema = mongoose.Schema
	, ObjectId = schema.ObjectId
	, Usage = require('./Usage')
	, async = require('async')
	, ansi2html = new (require('ansi-to-html'))
	, fs = require('fs')

var droneSchema = schema({
	name: String,
	pkg: {},
	user: {
		type: ObjectId,
		ref: "User"
	},
	deleted: { type: Boolean, default: false },
	location: String,
	isRunning: Boolean,
	isInstalled: { type: Boolean, default: false },
	installedOn: String, // label of the nodecloud instance looking after this drone
	pid: Number,
	logs: [{
		created: Date,
		location: String
	}]
})

droneSchema.methods.pullDroneDetails = function (cb) {
	var self = this;
	
	async.parallel({
		usage: function(done) {
			Usage.getUsageForDrone(self._id, function(usage) {
				done(null, usage)
			})
		},
		log: function(done) {
			if (self.logs.length > 0) {
				self.getLog(self.logs[self.logs.length-1], function(log) {
					done(null, log);
				});
			} else {
				done(null, "");
			}
		}
	}, function(err, results) {
		if (err) throw err;
		
		cb(results)
	})
}

droneSchema.methods.getLog = function (log, length, cb) {
	if (typeof length === "function") {
		cb = length;
		length = 100;
	} else if (typeof cb !== "function") {
		return;
	}
	
	if (!log || !log.location) {
		cb("");
		return;
	}
	
	fs.exists(log.location, function(logExists) {
		if (logExists) {
			fs.readFile(log.location, function(err, data) {
				if (err) {
					cb("");
					return;
				}
				
				// Parse logs
				// Do some parsing..
				log = "";
				var lines = data.toString().split('\n');
				for (var i = lines.length-1; i >= 0; i--) {
					var line = lines[i]
					
					log += line + "<br/>";
					
					// have max length
					if (i + length < lines.length) break;
				}
				
				log = ansi2html.toHtml(log)
				
				cb(log);
			})
		} else {
			cb("");
		}
	})
}

droneSchema.statics.getDronesByUserId = function (userID, cb) {
	if (!userID) {
		cb([])
		return;
	}
	
	module.exports.find({
		user: userID
	}, function(err, drones) {
		if (err) throw err;
		console.log("DS" + drones)
		cb(drones);
	})
}

module.exports = mongoose.model("Drone", droneSchema);