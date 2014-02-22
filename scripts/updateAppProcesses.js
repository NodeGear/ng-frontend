// Created on 22/2/2014

require('../app')
var models = require('../models')
var async = require('async')

models.Drone.find({}, function(err, drones) {
	async.each(drones, function(drone, cb) {
		drone.processes = 1;
		drone.save(cb);
	}, function(err) {
		if (err) throw err;
		
		process.exit(1);
	})
})