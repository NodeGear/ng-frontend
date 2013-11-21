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
		location: String,
		content: String
	}],
	env: [{
		name: String,
		value: String,
		created: { type: Date, default: Date.now() },
	}]
})

droneSchema.methods.pullDroneDetails = function (cb) {
	var self = this;
	
	async.parallel({
		usage: function(done) {
			Usage.getUsageForDrone(self._id, function(usage) {
				done(null, usage)
			})
		}
	}, function(err, results) {
		if (err) throw err;
		
		cb(results)
	})
}

droneSchema.methods.getLog = function (log, length, parse, cb) {
	if (typeof length === "function") {
		cb = length;
		length = 100;
	}
	if (typeof parse === "function") {
		cb = parse;
		parse = true;
	}
	if (typeof cb !== "function") {
		return;
	}
	
	if (!log || !log.location) {
		cb(log);
		return;
	}
	
	fs.exists(log.location, function(logExists) {
		if (logExists) {
			fs.readFile(log.location, function(err, data) {
				if (err) {
					cb(log);
					return;
				}
				
				if (parse) {
					// Parse logs
					// Do some parsing..
					log.content = "";
					var lines = data.toString().split('\n');
					for (var i = lines.length-1; i >= 0; i--) {
						var line = lines[i]
						
						// removes the newline at the end of files
						if (i == lines.length-1 && line.length == 0) {
							continue;
						}
						
						log.content += line + "<br/>";
						
						// have max length
						if (length > 0) {
							if (i + length < lines.length) {
								break;
							}
						}
					}
				
					log.content = ansi2html.toHtml(log.content)
				} else {
					log.content = data;
				}
				
				cb(log);
			})
		} else {
			cb(log);
		}
	})
}

droneSchema.statics.getDronesByUserId = function (userID, cb) {
	if (!userID) {
		cb([])
		return;
	}
	
	var q = module.exports.find({ user: userID })
	q.select('name isRunning isInstalled installedOn deleted')
	q.exec(function(err, drones) {
			if (err) throw err;
		
			cb(drones);
		})
}

droneSchema.statics.getDroneById = function (id, cb) {
	module.exports.findById(id)
		.exec(function(err, drone) {
		if (err) throw err;
		
		cb(drone);
	})
}

module.exports = mongoose.model("Drone", droneSchema);