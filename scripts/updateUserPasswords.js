require('../app')
var models = require('../models')
var async = require('async')

// Warning Do NOT execute twice, as it would render all users' passwords unusable.
models.User.find({}, function(err, users) {
	async.each(users, function(user, cb) {
		user.setPassword(user.password);
		user.save(function(err) {
			cb(err);
		})
	}, function(err) {
		if (err) throw err;
		
		process.exit(1);
	})
})